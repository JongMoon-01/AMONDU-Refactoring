# app/kafka/consumer.py
# 위치: attention-model-fastapi-service/app/kafka/consumer.py
import json
import os
import logging
from aiokafka import AIOKafkaConsumer

logger = logging.getLogger(__name__)

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC = "enrollment.created"
GROUP_ID = "attention-enrollment-group"


async def start_enrollment_consumer():
    """enrollment.created 이벤트 소비 — 세션 준비용"""
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id=GROUP_ID,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
    )
    await consumer.start()
    logger.info("[Kafka] enrollment.created consumer started")
    try:
        async for msg in consumer:
            event = msg.value
            logger.info(
                "[Kafka] enrollment.created received: userId=%s, classId=%s",
                event.get("userId"), event.get("classId"),
            )
            # 세션 준비 로직 (예: Redis TTL 설정, 세션 캐시 초기화 등)
            # 현재는 로그만 기록 — Kafka 페이즈 이후 확장 예정
    finally:
        await consumer.stop()
