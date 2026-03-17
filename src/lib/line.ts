const LINE_API = "https://api.line.me/v2/bot/message/push";

interface BookingReceipt {
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number; // in satang
  bookingId: string;
}

function formatPrice(satang: number): string {
  return `฿${(satang / 100).toLocaleString()}`;
}

export async function sendBookingReceipt(
  lineUserId: string,
  receipt: BookingReceipt
) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("LINE_CHANNEL_ACCESS_TOKEN not set, skipping receipt");
    return;
  }

  const flexMessage = {
    to: lineUserId,
    messages: [
      {
        type: "flex",
        altText: `ยืนยันการจอง - ${receipt.serviceName}`,
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#06C755",
            paddingAll: "20px",
            contents: [
              {
                type: "text",
                text: "✅ จองสำเร็จ",
                color: "#FFFFFF",
                size: "xl",
                weight: "bold",
              },
              {
                type: "text",
                text: "พี่แกงส้ม",
                color: "#FFFFFFCC",
                size: "sm",
                margin: "sm",
              },
            ],
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: receipt.serviceName,
                size: "lg",
                weight: "bold",
                margin: "md",
              },
              {
                type: "separator",
                margin: "lg",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "lg",
                spacing: "sm",
                contents: [
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "วันที่",
                        color: "#888888",
                        size: "sm",
                        flex: 0,
                      },
                      {
                        type: "text",
                        text: receipt.date,
                        size: "sm",
                        align: "end",
                        weight: "bold",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "เวลา",
                        color: "#888888",
                        size: "sm",
                        flex: 0,
                      },
                      {
                        type: "text",
                        text: `${receipt.startTime} - ${receipt.endTime}`,
                        size: "sm",
                        align: "end",
                        weight: "bold",
                      },
                    ],
                  },
                  {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                      {
                        type: "text",
                        text: "รหัสการจอง",
                        color: "#888888",
                        size: "sm",
                        flex: 0,
                      },
                      {
                        type: "text",
                        text: receipt.bookingId.slice(-6).toUpperCase(),
                        size: "sm",
                        align: "end",
                        weight: "bold",
                      },
                    ],
                  },
                ],
              },
              {
                type: "separator",
                margin: "lg",
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "lg",
                contents: [
                  {
                    type: "text",
                    text: "รวมทั้งหมด",
                    size: "md",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: formatPrice(receipt.totalPrice),
                    size: "xl",
                    weight: "bold",
                    color: "#06C755",
                    align: "end",
                  },
                ],
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "ขอบคุณที่ใช้บริการค่ะ 💚",
                size: "sm",
                color: "#888888",
                align: "center",
              },
            ],
          },
        },
      },
    ],
  };

  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(flexMessage),
  });

  if (!res.ok) {
    console.error("Failed to send LINE receipt:", await res.text());
  }
}
