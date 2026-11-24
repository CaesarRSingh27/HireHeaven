import { Kafka, Consumer } from "kafkajs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const TOPIC = "send-mail";
const RETRY_MS = 5000;
const MAX_SEND_ATTEMPTS = 3;

let consumer: Consumer | undefined;
let stopping = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const smtpPort = Number(process.env.SMTP_PORT || 465);

// One pooled transporter for the whole process (was: one per message)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465,
  pool: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWithRetry(mail: {
  to: string;
  subject: string;
  html: string;
}) {
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM || `Hireheaven <${process.env.SMTP_USER}>`,
        ...mail,
      });
      console.log(`Mail has been sent to ${mail.to}`);
      return;
    } catch (error) {
      console.log(
        `Failed to send mail to ${mail.to} (attempt ${attempt}/${MAX_SEND_ATTEMPTS})`,
        error
      );
      if (attempt < MAX_SEND_ATTEMPTS) await sleep(1000 * 2 ** attempt);
    }
  }
  // Out of retries: log and move on so one bad message cannot block the topic.
  console.error(`Giving up on mail to ${mail.to}`);
}

export const startSendMailConsumer = async (): Promise<void> => {
  try {
    const kafka = new Kafka({
      clientId: "mail-service",
      brokers: [process.env.Kafka_Broker || "localhost:9092"],
      retry: { initialRetryTime: 300, retries: 8 },
    });

    // Make sure the topic exists even if the consumer starts before any producer
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
      topics: [{ topic: TOPIC, numPartitions: 1, replicationFactor: 1 }],
    });
    await admin.disconnect();

    const c = kafka.consumer({ groupId: "mail-service-group" });
    await c.connect();
    await c.subscribe({ topic: TOPIC, fromBeginning: false });

    console.log("✅ Mail service consumer started, listening for sending mail");

    await c.run({
      eachMessage: async ({ message }) => {
        try {
          const { to, subject, html } = JSON.parse(
            message.value?.toString() || "{}"
          );

          if (!to || !subject || !html) {
            console.log("Skipping malformed mail message");
            return;
          }

          await sendWithRetry({ to, subject, html });
        } catch (error) {
          console.log("Failed to process mail message", error);
        }
      },
    });

    consumer = c;
  } catch (error) {
    if (stopping) return;
    console.log(
      `failed to start kafka consumer, retrying in ${RETRY_MS / 1000}s`,
      error
    );
    setTimeout(startSendMailConsumer, RETRY_MS);
  }
};

export const stopSendMailConsumer = async () => {
  stopping = true;
  if (consumer) {
    await consumer.disconnect();
  }
};
