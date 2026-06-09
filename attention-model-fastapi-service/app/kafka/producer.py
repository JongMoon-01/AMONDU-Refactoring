# app/kafka/producer.py
# 위치: attention-model-fastapi-service/app/kafka/producer.py
import json
import os
import logging
from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "attention.score.measured"

_producer: AIOKafkaProducer | None = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )
        await _producer.start()
    return _producer


async def stop_producer():
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None


async def publish_attention_score(
    user_id: str,
    class_id: int,
    course_id: int,
    avg_focus_score: float,
    focus_drop_count: int,
    final_score: float,
):
    """attention.score.measured 이벤트 발행"""
    import time
    event = {
        "userId": user_id,
        "classId": class_id,
        "courseId": course_id,
        "avgFocusScore": avg_focus_score,
        "focusDropCount": focus_drop_count,
        "finalScore": final_score,
        "measuredAt": int(time.time() * 1000),
    }
    producer = await get_producer()
    await producer.send_and_wait(TOPIC, key=user_id, value=event)
    logger.info(
        "[Kafka] attention.score.measured published: userId=%s", user_id
    )
