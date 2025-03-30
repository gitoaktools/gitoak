import concurrent.futures
import io
import os
import urllib.parse as urlparse
import base64
import json
from functools import cached_property
import boto3
from typing import TYPE_CHECKING, List, Union
import mimetypes

import numpy as np
import pyarrow as pa
from pydantic import PrivateAttr
from tqdm import tqdm

from lancedb.util import attempt_import_or_raise
from lancedb.embeddings.base import EmbeddingFunction
from lancedb.embeddings.registry import register
from lancedb.embeddings.utils import IMAGES, url_retrieve

if TYPE_CHECKING:
    import PIL

@register("bedrock-cohere-embed-multilingual")
class BedrockCohereEmbeddings(EmbeddingFunction):
    """
    使用 Amazon Bedrock 的 Cohere 多模态模型的嵌入函数
    用于多模态文本到图像搜索
    """

    normalize: bool = True
    region: str = "us-west-2"
    profile_name: str = None
    assumed_role: str = None
    batch_size: int = 64
    role_session_name: str = "bedrock-cohere-session"
    _model = PrivateAttr()
    _preprocess = PrivateAttr()
    _tokenizer = PrivateAttr()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ndims = None

    @cached_property
    def client(self):
        """Create a boto3 client for Amazon Bedrock service

        Returns
        -------
        boto3.client
            The boto3 client for Amazon Bedrock service
        """
        botocore = attempt_import_or_raise("botocore")
        boto3 = attempt_import_or_raise("boto3")

        session_kwargs = {"region_name": self.region}
        client_kwargs = {**session_kwargs}

        if self.profile_name:
            session_kwargs["profile_name"] = self.profile_name

        retry_config = botocore.config.Config(
            region_name=self.region,
            retries={
                "max_attempts": 0,  # disable this as retries retries are handled
                "mode": "standard",
            },
        )
        session = (
            boto3.Session(**session_kwargs) if self.profile_name else boto3.Session()
        )
        if self.assumed_role:  # if not using default credentials
            sts = session.client("sts")
            response = sts.assume_role(
                RoleArn=str(self.assumed_role),
                RoleSessionName=self.role_session_name,
            )
            client_kwargs["aws_access_key_id"] = response["Credentials"]["AccessKeyId"]
            client_kwargs["aws_secret_access_key"] = response["Credentials"][
                "SecretAccessKey"
            ]
            client_kwargs["aws_session_token"] = response["Credentials"]["SessionToken"]

        service_name = "bedrock-runtime"

        bedrock_client = session.client(
            service_name=service_name, config=retry_config, **client_kwargs
        )

        return bedrock_client

    def ndims(self):
        if self._ndims is None:
            self._ndims = 1024
            #self._ndims = len(self.generate_text_embeddings("foo"))
        return 1024

    def compute_query_embeddings(
        self, query: Union[str, "PIL.Image.Image"], *args, **kwargs
    ) -> List[np.ndarray]:
        """
        计算给定用户查询的嵌入向量

        Parameters
        ----------
        query : Union[str, PIL.Image.Image]
            要嵌入的查询。查询可以是文本或图像。
        """
        if isinstance(query, str):
            return [self.generate_text_embeddings(query)]
        else:
            PIL = attempt_import_or_raise("PIL", "pillow")
            if isinstance(query, PIL.Image.Image):
                return [self.generate_image_embedding(query)]
            else:
                raise TypeError("BedrockCohere supports str or PIL Image as query")

    def generate_text_embeddings(self, text: str) -> np.ndarray:
        # 使用 Bedrock 的 Cohere 模型获取文本嵌入向量
        request_body = {
            "texts": [text],
            "input_type":"search_document"
        }

        response = self.client.invoke_model(
            modelId="cohere.embed-english-v3",
            body=json.dumps(request_body)
        )

        response_body = json.loads(response.get("body").read())
        embeddings = response_body.get("embeddings", [])
        return np.array(embeddings)

    def sanitize_input(self, images: IMAGES) -> Union[List[bytes], np.ndarray]:
        """
        清理嵌入函数的输入。
        """
        if isinstance(images, (str, bytes)):
            images = [images]
        elif isinstance(images, pa.Array):
            images = images.to_pylist()
        elif isinstance(images, pa.ChunkedArray):
            images = images.combine_chunks().to_pylist()
        return images

    def compute_source_embeddings(
        self, images: IMAGES, *args, **kwargs
    ) -> List[np.ndarray]:
        """
        获取给定图像的嵌入向量
        """
        images = self.sanitize_input(images)
        embeddings = []
        for i in range(0, len(images), self.batch_size):
            j = min(i + self.batch_size, len(images))
            batch = images[i:j]
            embeddings.extend(self._parallel_get(batch))
        return embeddings

    def _parallel_get(self, images: Union[List[str], List[bytes]]) -> List[np.ndarray]:
        """
        发出并发请求以检索图像数据
        """
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(self.generate_image_embedding, image)
                for image in images
            ]
            return [future.result() for future in tqdm(futures)]

    def generate_image_embedding(
        self, image: Union[str, bytes, "PIL.Image.Image"]
    ) -> np.ndarray:
        """
        为单个图像生成嵌入向量

        Parameters
        ----------
        image : Union[str, bytes, PIL.Image.Image]
            要嵌入的图像。如果图像是 str，则将其视为 uri。
            如果图像是 bytes，则将其视为原始图像字节。
        """
        image = self._to_pil(image)
        image_bytes = self._image_to_bytes(image)
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        request_body = {
            #"texts": [],  
            "images": [f"data:image/jpg;base64,{base64_image}"],
            "input_type":"image",
        }

        response = self.client.invoke_model(
            modelId="cohere.embed-multilingual-v3",
            body=json.dumps(request_body)
        )

        response_body = json.loads(response.get("body").read())
        embeddings = response_body.get("embeddings", [])[0]
        return np.array(embeddings)

    def _to_pil(self, image: Union[str, bytes]):
        PIL = attempt_import_or_raise("PIL", "pillow")
        if isinstance(image, bytes):
            return PIL.Image.open(io.BytesIO(image))
        if isinstance(image, PIL.Image.Image):
            return image
        elif isinstance(image, str):
            parsed = urlparse.urlparse(image)
            if parsed.scheme == "file":
                return PIL.Image.open(parsed.path)
            elif parsed.scheme == "":
                return PIL.Image.open(image if os.name == "nt" else parsed.path)
            elif parsed.scheme.startswith("http"):
                return PIL.Image.open(io.BytesIO(url_retrieve(image)))
            else:
                raise NotImplementedError("Only local and http(s) urls are supported")

    def _image_to_bytes(self, image: "PIL.Image.Image") -> bytes:
        """
        将 PIL 图像转换为字节
        """
        with io.BytesIO() as output:
            image.save(output, format="PNG")
            return output.getvalue()


@register("bedrock-titan-embed-multilingual")
class BedrockTitanEmbeddings(EmbeddingFunction):
    """
    使用 Amazon Bedrock 的 Titan 多模态模型的嵌入函数
    用于多模态文本到图像搜索
    """

    normalize: bool = True
    region: str = "us-west-2"
    profile_name: str = None
    assumed_role: str = None
    batch_size: int = 64
    role_session_name: str = "bedrock-titan-session"
    _model = PrivateAttr()
    _preprocess = PrivateAttr()
    _tokenizer = PrivateAttr()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._ndims = None

    @cached_property
    def client(self):
        """Create a boto3 client for Amazon Bedrock service

        Returns
        -------
        boto3.client
            The boto3 client for Amazon Bedrock service
        """
        botocore = attempt_import_or_raise("botocore")
        boto3 = attempt_import_or_raise("boto3")

        session_kwargs = {"region_name": self.region}
        client_kwargs = {**session_kwargs}

        if self.profile_name:
            session_kwargs["profile_name"] = self.profile_name

        retry_config = botocore.config.Config(
            region_name=self.region,
            retries={
                "max_attempts": 0,  # disable this as retries retries are handled
                "mode": "standard",
            },
        )
        session = (
            boto3.Session(**session_kwargs) if self.profile_name else boto3.Session()
        )
        if self.assumed_role:  # if not using default credentials
            sts = session.client("sts")
            response = sts.assume_role(
                RoleArn=str(self.assumed_role),
                RoleSessionName=self.role_session_name,
            )
            client_kwargs["aws_access_key_id"] = response["Credentials"]["AccessKeyId"]
            client_kwargs["aws_secret_access_key"] = response["Credentials"][
                "SecretAccessKey"
            ]
            client_kwargs["aws_session_token"] = response["Credentials"]["SessionToken"]

        service_name = "bedrock-runtime"

        bedrock_client = session.client(
            service_name=service_name, config=retry_config, **client_kwargs
        )

        return bedrock_client

    def ndims(self):
        if self._ndims is None:
            self._ndims = 1024
            #self._ndims = len(self.generate_text_embeddings("foo"))
        return 1024

    def compute_query_embeddings(
        self, query: Union[str, "PIL.Image.Image"], *args, **kwargs
    ) -> List[np.ndarray]:
        """
        计算给定用户查询的嵌入向量

        Parameters
        ----------
        query : Union[str, PIL.Image.Image]
            要嵌入的查询。查询可以是文本或图像。
        """
        if isinstance(query, str):
            return [self.generate_text_embeddings(query)]
        else:
            PIL = attempt_import_or_raise("PIL", "pillow")
            if isinstance(query, PIL.Image.Image):
                return [self.generate_image_embedding(query)]
            else:
                raise TypeError("BedrockCohere supports str or PIL Image as query")

    def generate_text_embeddings(self, text: str) -> np.ndarray:
        # 使用 Bedrock 的 Cohere 模型获取文本嵌入向量
        request_body = {
            "inputText": text,
        }

        response = self.client.invoke_model(
            modelId="amazon.titan-embed-image-v1",
            body=json.dumps(request_body)
        )

        response_body = json.loads(response.get("body").read())
        embeddings = response_body.get("embedding", [])
        return np.array(embeddings)

    def sanitize_input(self, images: IMAGES) -> Union[List[bytes], np.ndarray]:
        """
        清理嵌入函数的输入。
        """
        if isinstance(images, (str, bytes)):
            images = [images]
        elif isinstance(images, pa.Array):
            images = images.to_pylist()
        elif isinstance(images, pa.ChunkedArray):
            images = images.combine_chunks().to_pylist()
        return images

    def compute_source_embeddings(
        self, images: IMAGES, *args, **kwargs
    ) -> List[np.ndarray]:
        """
        获取给定图像的嵌入向量
        """
        images = self.sanitize_input(images)
        embeddings = []
        for i in range(0, len(images), self.batch_size):
            j = min(i + self.batch_size, len(images))
            batch = images[i:j]
            embeddings.extend(self._parallel_get(batch))
        return embeddings

    def _parallel_get(self, images: Union[List[str], List[bytes]]) -> List[np.ndarray]:
        """
        发出并发请求以检索图像数据
        """
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(self.generate_image_embedding, image)
                for image in images
            ]
            return [future.result() for future in tqdm(futures)]

    def generate_image_embedding(
        self, image: Union[str, bytes, "PIL.Image.Image"]
    ) -> np.ndarray:
        """
        为单个图像生成嵌入向量

        Parameters
        ----------
        image : Union[str, bytes, PIL.Image.Image]
            要嵌入的图像。如果图像是 str，则将其视为 uri。
            如果图像是 bytes，则将其视为原始图像字节。
        """
        image = self._to_pil(image)
        image_bytes = self._image_to_bytes(image)
        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        request_body = {
            "inputImage": base64_image,
        }

        response = self.client.invoke_model(
            modelId="amazon.titan-embed-image-v1",
            body=json.dumps(request_body)
        )

        response_body = json.loads(response.get("body").read())
        embeddings = response_body.get("embedding", [])
        return np.array(embeddings)

    def _to_pil(self, image: Union[str, bytes]):
        PIL = attempt_import_or_raise("PIL", "pillow")
        if isinstance(image, bytes):
            return PIL.Image.open(io.BytesIO(image))
        if isinstance(image, PIL.Image.Image):
            return image
        elif isinstance(image, str):
            parsed = urlparse.urlparse(image)
            if parsed.scheme == "file":
                return PIL.Image.open(parsed.path)
            elif parsed.scheme == "":
                return PIL.Image.open(image if os.name == "nt" else parsed.path)
            elif parsed.scheme.startswith("http"):
                return PIL.Image.open(io.BytesIO(url_retrieve(image)))
            else:
                raise NotImplementedError("Only local and http(s) urls are supported")

    def _image_to_bytes(self, image: "PIL.Image.Image") -> bytes:
        """
        将 PIL 图像转换为字节
        """
        with io.BytesIO() as output:
            image.save(output, format="PNG")
            return output.getvalue()