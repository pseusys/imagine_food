from logging import DEBUG, INFO, FileHandler, Formatter, Logger, StreamHandler, getLogger
from pathlib import Path

_LOGGIN_DIR = Path(__file__).parent.parent / "logs"

if not _LOGGIN_DIR.exists():
    _LOGGIN_DIR.mkdir()


def create_logger(name: str) -> Logger:
    logger = getLogger(name)
    logger.setLevel(DEBUG)
    stream_handler = StreamHandler()
    file_handler = FileHandler(_LOGGIN_DIR / f"{name}.log")
    formatter = Formatter(fmt="%(asctime)s.%(msecs)03d %(levelname)s: %(message)s", datefmt="%Y-%m-%d,%H:%M:%S")
    stream_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    stream_handler.setLevel(INFO)
    file_handler.setLevel(DEBUG)
    logger.addHandler(stream_handler)
    logger.addHandler(file_handler)
    return logger
