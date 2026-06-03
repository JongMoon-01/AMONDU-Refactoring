# app/services/text_chunker.py

from typing import List

def split_into_chunks(text: str, chunk_size: int = 500) -> List[str]:
    """
    긴 텍스트를 일정 크기의 청크로 분리

    Args:
        text (str): 청크로 나눌 텍스트
        chunk_size (int): 청크 길이 (기본 500자)

    Returns:
        List[str]: 청크 리스트
    """
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]
