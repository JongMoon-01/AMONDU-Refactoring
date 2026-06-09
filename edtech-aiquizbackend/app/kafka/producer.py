# app/kafka/producer.py
# 위치: edtech-aiquizbackend/app/kafka/producer.py
import json
import os
import logging
from kafka import KafkaProducer

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "quiz.generated"

_producer: KafkaProducer | None = None


def get_producer() -> KafkaProducer:
    global _producer
    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )
    return _producer


def publish_quiz_generated(
    user_id: str,
    class_id: int,
    course_id: int,
    lecture_id: int,
    quiz_count: int,
):
    """quiz.generated 이벤트 발행"""
    import time
    event = {
        "userId": user_id,
        "classId": class_id,
        "courseId": course_id,
        "lectureId": lecture_id,
        "quizCount": quiz_count,
        "generatedAt": int(time.time() * 1000),
    }
    try:
        get_producer().send(TOPIC, key=user_id, value=event)
        logger.info(
            "[Kafka] quiz.generated published: userId=%s, count=%d",
            user_id, quiz_count
        )
    except Exception as e:
        logger.warning("[Kafka] quiz.generated publish failed: %s", str(e))
