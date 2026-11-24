import { Kafka, Producer } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

let producer: Producer | undefined;

const RETRY_MS = 5000;

export const connectKafka = async (): Promise<void> => {
  try {
    const kafka = new Kafka({
      clientId: "job-service",
      brokers: [process.env.Kafka_Broker || "localhost:9092"],
      retry: { initialRetryTime: 300, retries: 8 },
    });

    const admin = kafka.admin();
    await admin.connect();

    const topics = await admin.listTopics();

    if (!topics.includes("send-mail")) {
      await admin.createTopics({
        topics: [{ topic: "send-mail", numPartitions: 1, replicationFactor: 1 }],
      });
      console.log("✅ Topic 'send-mail' created");
    }

    await admin.disconnect();

    const p = kafka.producer();
    await p.connect();
    producer = p;

    console.log("✅ connected to kafka producer");
  } catch (error) {
    console.log(`Failed to connect to kafka, retrying in ${RETRY_MS / 1000}s`, error);
    setTimeout(connectKafka, RETRY_MS);
  }
};

export const publishToTopic = async (topic: string, message: any) => {
  if (!producer) {
    console.log("kafka producer is not initialized");
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.log("Failed to publish message to kafka", error);
  }
};

export const disconnectKafka = async () => {
  if (producer) {
    await producer.disconnect();
  }
};
