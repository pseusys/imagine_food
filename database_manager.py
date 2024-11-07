from hashlib import sha256
from pathlib import Path
from shutil import rmtree
from typing import Optional
from urllib.request import urlretrieve
from zipfile import ZipFile

from tqdm import tqdm

from logging_manager import create_logger

_DATASETS_DIR = Path(__file__).parent / "datasets"

if not _DATASETS_DIR.exists():
    _DATASETS_DIR.mkdir()

logger = create_logger(__name__)


class DownloadProgressBar(tqdm):
    def update_to(self, b: int = 1, bsize: int = 1, tsize: int = None):
        if tsize is not None:
            self.total = tsize
        self.update(b * bsize - self.n)


def load_database(name: str, url: str, hash: Optional[str] = None) -> None:
    directory_name = _DATASETS_DIR / name
    archive_name = directory_name.with_suffix(".zip")
    if not archive_name.exists():
        logger.info(f"Downloading dataset '{url}' into {archive_name}...")
        with DownloadProgressBar(unit="B", unit_scale=True, miniters=1, desc=name) as t:
            urlretrieve(url, archive_name, t.update_to)
    else:
        logger.debug(f"Dataset '{url}' is found in {archive_name}!")
    if hash is not None:
        logger.debug(f"Verifying dataset {name} archive {archive_name} SHA256 checksum...")
        if sha256(archive_name.read_bytes()).hexdigest() == hash:
            logger.info(f"Dataset {name} SHA256 verification successful!")
        else:
            raise ValueError(f"Error verifying dataset {name} archive {archive_name} SHA256 checksum!")
    if directory_name.is_dir():
        logger.debug(f"Removing previous dataset {name} directory...")
        rmtree(directory_name)
    with ZipFile(archive_name, "r") as zipfile:
        logger.debug(f"Unpacking dataset {name} into {_DATASETS_DIR}...")
        zipfile.extractall(directory_name)
    logger.info(f"Dataset {name} available in {directory_name}!")


def verify_database(name: str) -> None:
    directory_name = _DATASETS_DIR / name
    if directory_name.is_dir():
        logger.info(f"Dataset {name} found in {directory_name}!")
    else:
        raise RuntimeError(f"Dataset {name} does not exist!")
