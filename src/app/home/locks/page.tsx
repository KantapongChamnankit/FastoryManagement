"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Lock, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import * as LockService from "@/lib/services/StockLocationService"
import * as ProductService from "@/lib/services/ProductService"
import * as UserService from "@/lib/services/UserService"
import { IStockLocation, IUser } from "@/lib"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useSession } from "next-auth/react"

export default function LocksPage() {
  const [locks, setLocks] = useState<(IStockLocation & { currentStock: number })[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLockId, setEditingLockId] = useState<string | null>(null)
  const [deleteLockId, setDeleteLockId] = useState<string | null>(null)
  const { toast } = useToast()
  const { lang } = useLanguage()
  const [user, setUser] = useState<IUser | null>(null)
  const { data: session, status } = useSession()
  const t = translations[lang]

  // Fetch locks from API
  useEffect(() => {
    const userId = (session as any)?.user?.id as string
    if (userId) {
      UserService.findById(userId)
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          toast({
            title: t.error ?? "Error",
            description: "Failed to fetch user data.",
            variant: "destructive",
          })
        })
    }
    fetchLocks()
  }, [])

  const fetchLocks = async () => {
    LockService.list()
      .then((data) => {
        ProductService.list()
          .then((products) => {
            const locksWithStock = data.map((lock) => {
              const currentStock = products
                .filter((product) => product.stock_location_id === lock._id)
                .reduce((sum, product) => sum + product.quantity, 0)
              return { ...lock, currentStock }
            })
            setLocks(locksWithStock)
          })
      })
  }

  const filteredLocks = locks.filter(
    (lock) =>
      lock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lock.position ?? " ").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = async (lockId: string) => {
    try {
      // const res = await fetch(`/api/locks/${lockId}`, { method: "DELETE" })
      // if (res.ok) {
      //   toast({
      //     title: "Storage lock deleted",
      //     description: "The storage lock has been successfully deleted.",
      //   })
      //   fetchLocks()
      // } else {
      //   toast({
      //     title: "Error",
      //     description: "Failed to delete storage lock.",
      //     variant: "destructive",
      //   })
      // }
      LockService.remove(lockId)
        .then(() => {
          toast({
            title: "Storage lock deleted",
            description: "The storage lock has been successfully deleted.",
          })
          fetchLocks()
        })
        .catch(() => {
          toast({
            title: t.error ?? "Error",
            description: "Failed to delete storage lock.",
            variant: "destructive",
          })
        })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete storage lock.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Nearly Full":
        return "bg-yellow-100 text-yellow-800"
      case "Full":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUtilizationPercentage = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.storageLocks ?? "Storage Locks"}</h1>
          <p className="text-slate-600">{t.manageLocks ?? "Manage storage locations and capacity."}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t.addLock ?? "Add Storage Lock"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addNewLock ?? "Add New Storage Lock"}</DialogTitle>
            </DialogHeader>
            <LockForm onClose={() => setIsAddDialogOpen(false)} fetchLocks={fetchLocks} t={t} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder={t.searchStorageLocks ?? "Search storage locks..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Storage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.totalLocks ?? "Total Locks"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{locks.length}</div>
            <p className="text-xs text-slate-500 mt-1">{t.storageLocations ?? "Storage locations"}</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.totalCapacity ?? "Total Capacity"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {locks.reduce((sum, lock) => sum + lock.capacity, 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.maximumItems ?? "Maximum items"}</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{t.currentStock ?? "Current Stock"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {locks.reduce((sum, lock) => sum + lock.currentStock, 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.itemsStored ?? "Items stored"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Locks Table */}
      <Card className="border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700">{t.lockName ?? "Lock Name"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.location ?? "Location"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.capacity ?? "Capacity"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.utilization ?? "Utilization"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.status ?? "Status"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.actions ?? "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocks.map((lock) => {
              const utilization = getUtilizationPercentage(lock.currentStock, lock.capacity)
              return (
                <TableRow key={lock._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center bg-blue-100 text-blue-600">
                        <Lock className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-900">{lock.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{lock.position ?? " "}</TableCell>
                  <TableCell className="text-slate-600">
                    {lock.currentStock} / {lock.capacity}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-2">
                        <div
                          className={`h-2 ${utilization >= 90 ? "bg-red-500" : utilization >= 70 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">{utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      let status = "Active"
                      if (lock.currentStock >= lock.capacity) {
                        status = "Full"
                      } else if (lock.currentStock >= lock.capacity * 0.9) {
                        status = "Nearly Full"
                      }
                      return (
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog open={editingLockId === lock._id} onOpenChange={(open) => setEditingLockId(open ? lock._id as string : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setEditingLockId(lock._id as string)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t.editLock ?? "Edit Storage Lock"}</DialogTitle>
                          </DialogHeader>
                          <LockForm
                            lock={lock}
                            fetchLocks={fetchLocks}
                            onClose={() => setEditingLockId(null)}
                            t={t}
                          />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteLockId(lock._id as string)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {"Are you sure you want to delete this storage lock?"}
                            </AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteLockId(null)}>
                              {t.cancel ?? "Cancel"}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                ProductService.list({ stock_location_id: lock._id as string }).then(products => {
                                  if (products.length > 0) {
                                    products.forEach(product => {
                                      ProductService.remove(product._id as string, user as IUser)
                                    })
                                  }
                                })
                                await handleDelete(lock._id as string)
                                setDeleteLockId(null)
                              }}
                            >
                              {t.delete ?? "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

function LockForm({ lock, onClose, fetchLocks, t }: { lock?: (IStockLocation & { currentStock: number }); onClose: () => void; fetchLocks: () => void; t: any }) {
  const { toast } = useToast()
  const [name, setName] = useState(lock?.name || "")
  const [capacity, setCapacity] = useState(lock?.capacity || 0)
  const [location, setLocation] = useState(lock?.position || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // const method = lock ? "PUT" : "POST"
      // const url = lock ? `/api/locks/${lock.id}` : "/api/locks"
      // const res = await fetch(url, {
      //   method,
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ name, capacity, location }),
      // })
      const res = lock
        ? await LockService.update(lock._id as string, name, location, capacity)
        : await LockService.create(name, location, capacity);
      toast({
        title: lock ? (t.storageLockUpdated ?? "Storage lock updated") : (t.storageLockCreated ?? "Storage lock created"),
        description: lock
          ? (t.storageLockUpdatedDesc ?? "The storage lock has been updated successfully.")
          : (t.storageLockCreatedDesc ?? "New storage lock has been created successfully."),
      })
      fetchLocks()
      onClose()
    } catch {
      toast({
        title: t.error ?? "Error",
        description: lock
          ? (t.failedToUpdateStorageLock ?? "Failed to update storage lock.")
          : (t.failedToCreateStorageLock ?? "Failed to create storage lock."),
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.lockName ?? "Lock Name"}</Label>
        <Input id="name" placeholder={t.enterLockName ?? "Enter lock name (e.g., Lock A1)"} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">{t.capacity ?? "Capacity"}</Label>
        <Input
          id="capacity"
          type="number"
          placeholder={t.enterMaxCapacity ?? "Enter maximum capacity"}
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">{t.location ?? "Location"}</Label>
        <Input id="location" placeholder={t.enterStorageLocation ?? "Enter storage location"} value={location} onChange={(e) => setLocation(e.target.value)} required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t.cancel ?? "Cancel"}
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          {lock ? (t.update ?? "Update") : (t.create ?? "Create")} {t.lock ?? "Lock"}
        </Button>
      </div>
    </form>
  )
}
