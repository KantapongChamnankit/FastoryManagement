"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Search, Shield, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts"
import { translations } from "@/lib/utils/Language"
import * as UserService from "@/lib/services/UserService"
import * as RoleService from "@/lib/services/RoleService"
import { IRole, IUser } from "@/lib"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import Loading from "./loading"

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([])
  const [roles, setRoles] = useState<IRole[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<IUser | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const { lang } = useLanguage()
  const t = translations[lang]

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [])

  function fetchRoles() {
    RoleService.list()
      .then(setRoles)
      .catch(() => {
        toast({ title: t.error ?? "Error", description: "Failed to fetch roles.", variant: "destructive" })
      })
  }

  function fetchUsers() {
    UserService.list()
      .then(setUsers)
      .catch(() => {
        toast({ title: t.error ?? "Error", description: t.failedToFetchUsers ?? "Failed to fetch users.", variant: "destructive" })
      })
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.first_name + user.last_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleDelete(userId: string) {
    try {
      // const res = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      UserService.removeUser(userId)
        .then(() => {
          toast({ title: t.userDeleted ?? "User deleted", description: t.userDeletedDesc ?? "The user has been successfully deleted." })
          fetchUsers()
        })
        .catch(() => {
          toast({ title: t.error ?? "Error", description: t.failedToDeleteUser ?? "Failed to delete user.", variant: "destructive" })
        })
    } catch {
      toast({ title: t.error ?? "Error", description: t.failedToDeleteUser ?? "Failed to delete user.", variant: "destructive" })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "staff":
        return "bg-blue-100 text-white-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) =>
    status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{t.userManagement ?? "User Management"}</h1>
          <p className="text-slate-600">{t.manageUsers ?? "Manage users and their permissions."}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                {t.permissions ?? "Permissions"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{t.permissionManagement ?? "Permission Management"}</DialogTitle>
              </DialogHeader>
              <PermissionMatrix onClose={() => setIsPermissionDialogOpen(false)} t={t} roles={roles} />
            </DialogContent>
          </Dialog> */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                {t.addUser ?? "Add User"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.addNewUser ?? "Add New User"}</DialogTitle>
              </DialogHeader>
              <UserForm onClose={() => setIsAddDialogOpen(false)} fetchUsers={fetchUsers} t={t} roles={roles} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder={t.searchUsers ?? "Search users..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200">
              <TableHead className="font-semibold text-slate-700">{t.user ?? "User"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.email ?? "Email"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.role ?? "Role"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.status ?? "Status"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.lastLogin ?? "Last Login"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.created ?? "Created"}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t.actions ?? "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center bg-blue-100 text-blue-600">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-900">{user.first_name + " " + user.last_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{user.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleColor(roles.find((r) => r._id === user.role_id)?.name || user.role_id)}>
                    {(() => {
                      const roleName = roles.find((r) => r._id === user.role_id)?.name?.toLowerCase();
                      return roleName ? (t as Record<string, string>)[roleName] ?? roleName : user.role_id;
                    })()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>
                    {(t as Record<string, string>)[user.status?.toLowerCase()] ?? user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">{new Date(user.updatedAt as string).toISOString().slice(0, 10)}</TableCell>
                <TableCell className="text-slate-600">{new Date(user.createdAt as string).toISOString().slice(0, 10)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null) }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t.editUser ?? "Edit User"}</DialogTitle>
                        </DialogHeader>
                        <UserForm
                          user={editingUser as IUser}
                          onClose={() => setEditingUser(null)}
                          fetchUsers={fetchUsers}
                          t={t}
                          roles={roles}
                        />
                      </DialogContent>
                    </Dialog>
                    {/* Delete with confirm dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => setDeleteUserId(user._id as string)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {"Are you sure you want to delete this user?"}
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteUserId(null)}>
                            {t.cancel ?? "Cancel"}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              if (deleteUserId) {
                                await handleDelete(deleteUserId)
                                setDeleteUserId(null)
                              }
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
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

interface UserFormProps {
  user?: IUser
  onClose: () => void
  fetchUsers: () => void
  t: any
  roles: IRole[]
}

function UserForm({ user, onClose, fetchUsers, t, roles }: UserFormProps) {
  const { toast } = useToast()
  const [name, setName] = useState(user?.first_name + " " + user?.last_name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [role, setRole] = useState(roles.find((r) => r._id === user?.role_id)?.name || "staff")
  const [status, setStatus] = useState(user?.status || "active")
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.first_name + " " + user.last_name)
      setEmail(user.email)
      setRole(roles.find((r) => r._id === user.role_id)?.name || "Staff")
      setStatus(user.status || "active")
    } else {
      setName("")
      setEmail("")
      setRole("Staff")
      setStatus("active")
      setPassword("")
    }
  }, [user, roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (user) {
        UserService.updateUser(user._id as string, {
          first_name: name.split(" ")[0],
          last_name: name.split(" ")[1],
          email,
          role_id: roles.find((r) => r.name === role)?._id || user.role_id,
          status: status.toLowerCase() as "active" | "inactive"
        }).then(() => {
          toast({
            title: t.userUpdated ?? "User updated",
            description: t.userUpdatedDesc ?? "The user has been successfully updated.",
          })
          onClose()
          fetchUsers()
        }).catch(() => {
          toast({
            title: t.error ?? "Error",
            description: t.failedToUpdateUser ?? "Failed to update user.",
            variant: "destructive",
          })
        })
      } else {
        UserService.createUser({
          first_name: name.split(" ")[0],
          last_name: name.split(" ")[1],
          email,
          password,
          role_id: roles.find((r) => r.name === role)?._id || "",
          image_id: "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
        }).then(() => {
          toast({
            title: t.userCreated ?? "User created",
            description: t.userCreatedDesc ?? "New user has been created successfully.",
          })
          onClose()
          fetchUsers()
        }).catch(() => {
          toast({
            title: t.error ?? "Error",
            description: t.failedToCreateUser ?? "Failed to create user.",
            variant: "destructive",
          })
        })
      }
    } catch {
      toast({
        title: t.error ?? "Error",
        description: user
          ? (t.failedToUpdateUser ?? "Failed to update user.")
          : (t.failedToCreateUser ?? "Failed to create user."),
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t.fullName ?? "Full Name"}</Label>
          <Input id="name" placeholder={t.enterFullName ?? "Enter full name"} value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.email ?? "Email"}</Label>
          <Input id="email" type="email" placeholder={t.enterEmail ?? "Enter email address"} value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">{t.role ?? "Role"}</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectRole ?? "Select role"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">{"Admin"}</SelectItem>
              <SelectItem value="staff">{"Staff"}</SelectItem>
              <SelectItem value="viewer">{"Viewer"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t.status ?? "Status"}</Label>
          <Select value={status} onValueChange={value => setStatus(value as "active" | "inactive")}>
            <SelectTrigger>
              <SelectValue placeholder={t.selectStatus ?? "Select status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t.active ?? "Active"}</SelectItem>
              <SelectItem value="inactive">{t.inactive ?? "Inactive"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">{t.password ?? "Password"}</Label>
          <Input id="password" type="password" placeholder={t.enterPassword ?? "Enter password"} value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
      )}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t.cancel ?? "Cancel"}
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          {user ? (t.update ?? "Update") : (t.create ?? "Create")} {t.user ?? "User"}
        </Button>
      </div>
    </form>
  )
}

interface PermissionMatrixProps {
  onClose: () => void
  t: any
  roles: IRole[]
}

function PermissionMatrix({ onClose, t, roles }: PermissionMatrixProps) {
  const modules = ["products", "sales", "categories", "locks", "reports", "users"]
  const actions = ["create", "read", "update", "delete"]
  const [roleId, setRoleId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({})
  const { toast } = useToast()
  const { theme } = useTheme()

  useEffect(() => {
    if (!roleId && roles.length > 0) setRoleId(roles[0]._id as string)
  }, [roles, roleId])

  useEffect(() => {
    if (!roleId) return
    setLoading(true)
    RoleService.getRolePermissions(roleId).then(data => {
      const convertToMatrix = (permObj: { [key: string]: string[] }) => {
        const obj: Record<string, Record<string, boolean>> = {}
        modules.forEach(m => {
          obj[m] = {}
          actions.forEach(a => {
            obj[m][a] = permObj?.[m]?.includes(a) ?? false
          })
        })
        return obj
      }
      setMatrix(data ? convertToMatrix(data) : getDefaultMatrix())
      setLoading(false)
    }).catch(() => {
      toast({ title: t.error ?? "Error", description: t.failedToLoadPermissions ?? "Failed to load permissions.", variant: "destructive" })
      setMatrix(getDefaultMatrix())
      setLoading(false)
    })
  }, [roleId, roles])

  function getDefaultMatrix() {
    const obj: Record<string, Record<string, boolean>> = {}
    modules.forEach(m => {
      obj[m] = {}
      actions.forEach(a => { obj[m][a] = false })
    })
    return obj
  }

  function handleCheck(module: string, action: string, checked: boolean) {
    setMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: checked }
    }))
  }

  async function handleSave() {
    setSaving(true)
    const permissions = Object.fromEntries(
      Object.entries(matrix).map(([module, actions]) => [
        module,
        Object.entries(actions).filter(([_, value]) => value).map(([action]) => action)
      ])
    )
    const res = await RoleService.update(
      roleId,
      {
        name: roles.find(r => r._id === roleId)?.name || "",
        permissions
      }
    )
    setSaving(false)
    if (res.ok) {
      toast({ title: t.savePermissions ?? "Save Permissions", description: t.saveSuccess ?? "Permissions saved." })
      onClose()
    } else {
      toast({ title: t.error ?? "Error", description: t.saveFailed ?? "Failed to save permissions.", variant: "destructive" })
    }
  }

  if (loading) {
    return <Loading theme={theme ?? "dark"} />
  }

  return (
    <div className="space-y-6">
      {/* <div className="text-sm text-slate-600">
        {t.configurePermissions ?? "Configure permissions for different user roles. Changes will apply to all users with the selected role."}
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="w-24">{t.role ?? "Role"}:</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role._id} value={role._id as string}>
                  {t[role.name?.toLowerCase()] ?? role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-semibold text-slate-700">{t.module ?? "Module"}</TableHead>
                {actions.map((action) => (
                  <TableHead key={action} className="font-semibold text-slate-700 text-center">
                    {t[action] ?? action.charAt(0).toUpperCase() + action.slice(1)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module} className="border-b border-slate-100">
                  <TableCell className="font-medium text-slate-900 capitalize">{t[module] ?? module}</TableCell>
                  {actions.map((action) => (
                    <TableCell key={action} className="text-center">
                      <Checkbox
                        checked={!!matrix[module]?.[action]}
                        onCheckedChange={checked => handleCheck(module, action, !!checked)}
                        disabled={loading}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          {t.cancel ?? "Cancel"}
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saving || loading}>
          {saving ? (t.saving ?? "Saving...") : (t.savePermissions ?? "Save Permissions")}
        </Button>
      </div> */}
    </div>
  )
}
