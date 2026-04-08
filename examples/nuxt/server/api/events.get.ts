import { sseClients } from "../store";

export default defineEventHandler((event) => {
  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (eventName: string, data: string) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${eventName}\ndata: ${data}\n\n`),
          );
        } catch {
          // Stream closed
          sseClients.delete(send);
        }
      };
      sseClients.add(send);
      event.node.req.on("close", () => {
        sseClients.delete(send);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
