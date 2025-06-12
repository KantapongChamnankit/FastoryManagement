import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Here you can integrate with AI services like OpenAI, Anthropic, etc.
    // For now, we'll use a simple rule-based system
    const response = await generateResponse(message)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

async function generateResponse(message: string): Promise<string> {
  const lowerMessage = message.toLowerCase()

  // Inventory-specific responses
  const responses = {
    greeting: [
      "Hello! I'm your inventory assistant. How can I help you today?",
      "Hi there! What can I help you with regarding your inventory?",
      "Welcome! I'm here to assist with your inventory management needs.",
    ],
    products: [
      "I can help you manage products! You can add new items, update existing ones, or check stock levels. What would you like to do?",
      "For product management, you can use the Products page to view, add, edit, or delete items. Need help with a specific task?",
      "Product management includes adding new items, updating quantities, setting prices, and organizing by categories. How can I assist?",
    ],
    sales: [
      "For sales, you can scan barcodes to add items to your cart and process transactions. Would you like me to guide you through the process?",
      "The sales process is simple: scan products, adjust quantities, and confirm the sale. Need help with any specific step?",
      "You can process sales by scanning barcodes or manually adding products to the cart. What would you like to know?",
    ],
    reports: [
      "Reports show your sales trends, profit analysis, and inventory insights. You can find detailed analytics on the Reports page.",
      "I can help you understand your business performance through various reports including sales, profit, and inventory analysis.",
      "Analytics and reports help track your business performance. What specific metrics are you interested in?",
    ],
    help: [
      "I can assist with:\n• Product management\n• Sales processing\n• Inventory tracking\n• Reports and analytics\n• User management\n• System navigation",
      "Here are the main areas I can help with:\n• Adding/editing products\n• Processing sales\n• Checking stock levels\n• Generating reports\n• Managing users and permissions",
      "I'm here to help with all aspects of inventory management. What specific area would you like assistance with?",
    ],
  }

  // Determine response category
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return getRandomResponse(responses.greeting)
  }

  if (lowerMessage.includes("product") || lowerMessage.includes("inventory") || lowerMessage.includes("stock")) {
    return getRandomResponse(responses.products)
  }

  if (lowerMessage.includes("sale") || lowerMessage.includes("sell") || lowerMessage.includes("transaction")) {
    return getRandomResponse(responses.sales)
  }

  if (lowerMessage.includes("report") || lowerMessage.includes("analytics") || lowerMessage.includes("chart")) {
    return getRandomResponse(responses.reports)
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what")) {
    return getRandomResponse(responses.help)
  }

  // Default response
  return "I understand you're asking about inventory management. Could you be more specific? I can help with products, sales, reports, or general system navigation."
}

function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)]
}
