import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Db, ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || 'last-6-months'
    const reportType = searchParams.get('reportType') || 'sales'
    
    const db = await getDatabase()
    
    // Check if we have data in our collections
    const [salesCount, productsCount, categoriesCount] = await Promise.all([
      db.collection('sales').countDocuments(),
      db.collection('products').countDocuments(),
      db.collection('categories').countDocuments()
    ])
    
    // Create sample data only if any collection is empty
    if (salesCount === 0 || productsCount === 0 || categoriesCount === 0) {
      await createSampleData(db, { salesCount, productsCount, categoriesCount })
    }
    
    // Get date range filter
    const dateFilter = getDateFilter(dateRange)
    
    // Get sales trend data based on report type
    let salesTrend;
    if (reportType === 'sales' || reportType === 'profit') {
      salesTrend = await db.collection('sales')
        .aggregate([
          { $match: { timestamp: { $gte: dateFilter } } },
          { $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
              sales: { $sum: "$total" },
              profit: { $sum: "$profit" },
              totalPrice: { $sum: { $multiply: ["$unitPrice", "$quantity"] } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]).toArray()
    } else if (reportType === 'inventory') {
      // For inventory report, get inventory levels over time
      salesTrend = await db.collection('sales')
        .aggregate([
          { $match: { timestamp: { $gte: dateFilter } } },
          { $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
              inventory: { $avg: "$inventoryValue" }
            }
          },
          { $sort: { _id: 1 } }
        ]).toArray()
    } else if (reportType === 'category') {
      // For category report, focus on category data
      salesTrend = await db.collection('sales')
        .aggregate([
          { $match: { timestamp: { $gte: dateFilter } } },
          { $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "product"
            }
          },
          { $unwind: "$product" },
          { $group: {
              _id: { month: { $dateToString: { format: "%Y-%m", date: "$timestamp" } }, category: "$product.category" },
              sales: { $sum: "$total" }
            }
          },
          { $group: {
              _id: "$_id.month",
              categories: { $push: { category: "$_id.category", sales: "$sales" } }
            }
          },
          { $sort: { _id: 1 } }
        ]).toArray()
    }
    
    // Get current stock value
    const currentStockValue = await db.collection('products')
      .aggregate([
        { $group: {
            _id: null,
            value: { $sum: { $multiply: ["$quantity", "$unitPrice"] } }
          }
        }
      ]).toArray()

    // Get category data
    const categoryData = await db.collection('products')
      .aggregate([
        { $group: {
            _id: "$category",
            value: { $sum: "$quantity" },
            sales: { $sum: { $multiply: ["$unitPrice", "$quantity"] } }
          }
        },
        { $project: {
            name: "$_id",
            value: 1,
            sales: 1,
            _id: 0
          }
        },
        { $sort: { sales: -1 } }
      ]).toArray()
    
    // Add colors to category data
    const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
    const categoryDataWithColors = categoryData.map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
      name: item.name
    }))
    
    // Get best selling product
    const bestProduct = await db.collection('sales')
      .aggregate([
        { $group: {
            _id: "$productName",
            totalSold: { $sum: "$quantity" },
            totalRevenue: { $sum: "$total" }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 1 }
      ]).toArray()
    
    // Calculate key metrics
    const totalSales = salesTrend?.reduce((sum, item) => sum + (item.sales || 0), 0) || 0
    const totalProfit = salesTrend?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0
    const profitMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0
    const stockValue = currentStockValue[0]?.value || 0

    // Get low stock and out of stock counts
    const lowStockCount = await db.collection('products').countDocuments({ quantity: { $gt: 0, $lte: 10 } })
    const outOfStockCount = await db.collection('products').countDocuments({ quantity: 0 })
    
    // Calculate average order value
    const avgOrderValue = salesCount > 0 ? 
      (await db.collection('sales').aggregate([
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]).toArray())[0]?.total / salesCount : 0
    
    // Calculate return rate (if you have returns data)
    const returnsData = await db.collection('returns')?.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).toArray()
    
    const returnCount = returnsData?.[0]?.count || 0
    const returnRate = salesCount > 0 ? ((returnCount / salesCount) * 100).toFixed(1) + '%' : '0%'
    
    // Get previous period data for comparison
    const previousDateFilter = getPreviousPeriodFilter(dateRange)
    const previousPeriodSales = await db.collection('sales')
      .aggregate([
        { $match: { 
            timestamp: { 
              $gte: previousDateFilter, 
              $lt: dateFilter 
            } 
          } 
        },
        { $group: {
            _id: null,
            sales: { $sum: "$total" },
            profit: { $sum: "$profit" }
          }
        }
      ]).toArray()
    
    const previousSales = previousPeriodSales[0]?.sales || 0
    const previousProfit = previousPeriodSales[0]?.profit || 0
    
    // Calculate growth percentages
    const salesGrowth = previousSales > 0 ? Math.round(((totalSales - previousSales) / previousSales) * 100) : 0
    const profitGrowth = previousProfit > 0 ? Math.round(((totalProfit - previousProfit) / previousProfit) * 100) : 0
    
    const keyMetrics = {
      totalSales,
      totalProfit,
      profitMargin,
      currentStockValue: stockValue,
      totalTransactions: salesCount,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      avgOrderValue: Math.round(avgOrderValue),
      bestProduct: bestProduct[0]?._id || "None",
      topCategory: categoryDataWithColors[0]?.name || "None",
      avgProfitMargin: `${profitMargin}%`,
      returnRate,
      salesGrowth,
      profitGrowth
    }
    
    return NextResponse.json({ 
      salesTrend, 
      categoryData: categoryDataWithColors, 
      keyMetrics 
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch report data", details: (error as any).message },
      { status: 500 }
    )
  }
}

// Get previous period date filter based on current date range
function getPreviousPeriodFilter(dateRange: string): Date {
  const currentFilter = getDateFilter(dateRange)
  const now = new Date()
  const difference = now.getTime() - currentFilter.getTime()
  
  const previousDate = new Date(currentFilter.getTime() - difference)
  return previousDate
}

// Create sample data only for empty collections
async function createSampleData(db: Db, counts: { salesCount: number, productsCount: number, categoriesCount: number }) {
  const { salesCount, productsCount, categoriesCount } = counts
  const categories = ["Electronics", "Clothing", "Food", "Books", "Home"]
  
  // Create sample categories if they don't exist
  if (categoriesCount === 0) {
    console.log("Creating sample categories...")
    await db.collection('categories').insertMany(
      categories.map(name => ({
        name,
        description: `${name} category`,
        productCount: 0,
        createdAt: new Date()
      }))
    )
  }
  
  // Create sample products if they don't exist
  if (productsCount === 0) {
    console.log("Creating sample products...")
    const products = []
    for (let i = 1; i <= 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const quantity = Math.floor(Math.random() * 100)
      const unitPrice = Math.floor(Math.random() * 100) + 10
      
      products.push({
        name: `Product ${i}`,
        barcode: `PROD${i.toString().padStart(5, '0')}`,
        category,
        quantity,
        unitPrice,
        lotCost: Math.floor(unitPrice * 0.6),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    await db.collection('products').insertMany(products)
  }
  
  // Create sample sales if they don't exist
  if (salesCount === 0) {
    console.log("Creating sample sales...")
    // Get actual products from database
    const products = await db.collection('products').find().toArray()
    
    if (products.length > 0) {
      const sales = []
      // Create sales for the last 12 months
      const now = new Date()
      for (let i = 0; i < 365; i++) {
        const date = new Date()
        date.setDate(now.getDate() - i)
        
        // Create 1-5 sales per day
        const dailySales = Math.floor(Math.random() * 5) + 1
        for (let j = 0; j < dailySales; j++) {
          const product = products[Math.floor(Math.random() * products.length)]
          const quantity = Math.floor(Math.random() * 5) + 1
          const total = product.unitPrice * quantity
          const profit = total - (product.lotCost * quantity)
          
          // Calculate current inventory value at time of sale
          const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0)
          
          sales.push({
            productId: product._id,
            productName: product.name,
            quantity,
            unitPrice: product.unitPrice,
            total,
            profit,
            timestamp: date,
            inventoryValue
          })
        }
      }
      await db.collection('sales').insertMany(sales)
      
      // Create a few returns for sample data
      const returns = []
      for (let i = 0; i < 10; i++) {
        const sale = sales[Math.floor(Math.random() * sales.length)]
        returns.push({
          saleId: sale.productId,
          productName: sale.productName,
          quantity: Math.min(sale.quantity, Math.floor(Math.random() * 2) + 1),
          reason: ["Defective", "Wrong item", "Changed mind"][Math.floor(Math.random() * 3)],
          timestamp: new Date(sale.timestamp.getTime() + 86400000 * Math.floor(Math.random() * 7))
        })
      }
      
      // Create returns collection if it doesn't exist
      await db.createCollection('returns')
      await db.collection('returns').insertMany(returns)
    }
  }
}

function getDateFilter(dateRange: string): Date {
  const now = new Date()
  const newDate = new Date(now)
  
  switch (dateRange) {
    case 'last-7-days':
      newDate.setDate(now.getDate() - 7)
      break
    case 'last-30-days':
      newDate.setDate(now.getDate() - 30)
      break
    case 'last-3-months':
      newDate.setMonth(now.getMonth() - 3)
      break
    case 'last-6-months':
      newDate.setMonth(now.getMonth() - 6)
      break
    case 'last-year':
      newDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      newDate.setMonth(now.getMonth() - 6)
  }
  
  return newDate
}
