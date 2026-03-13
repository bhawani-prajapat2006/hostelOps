"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Zap,
  Trash2,
  Network,
  Brush,
  Loader2,
  ChevronRight
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const getCategoryIcon = (category) => {
  switch (category) {
    case "plumbing": return <Wrench className="w-4 h-4" />
    case "electrical": return <Zap className="w-4 h-4" />
    case "network": return <Network className="w-4 h-4" />
    case "cleanliness": return <Brush className="w-4 h-4" />
    default: return <AlertCircle className="w-4 h-4" />
  }
}

const getStatusStyles = (status) => {
  switch (status) {
    case "open": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "in_progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "closed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    default: return "bg-zinc-500/10 text-zinc-500"
  }
}

export default function Complaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints")
      // Accessing .complaints because of your PaginatedComplaints schema
      setComplaints(res.data.complaints || []) 
    } catch (err) {
      toast.error("Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/complaints/${id}`)
      toast.success("Complaint deleted successfully")
      setComplaints(complaints.filter(c => c.id !== id))
    } catch (err) {
      toast.error("Deletion failed: Permission denied")
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter font-serif italic">Complaints</h1>
          <p className="text-muted-foreground mt-1 font-medium">Resolution Center • IIT Jodhpur</p>
        </div>
        <Button className="gap-2 h-12 px-6 shadow-xl shadow-primary/20 rounded-xl font-bold">
          <Plus className="w-5 h-5" /> New Complaint
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by title or ID..." 
            className="pl-10 h-11 bg-card/50 border-border/50 rounded-xl focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl border-border/50 glass font-semibold gap-2">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-56 rounded-[2rem] bg-muted/40 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {complaints.length > 0 ? complaints.map((c, index) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="glass border-border/50 rounded-[2rem] group hover:border-primary/40 transition-all duration-500 overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <Badge variant="outline" className={`capitalize font-black tracking-wider text-[10px] py-1 px-3 rounded-full ${getStatusStyles(c.status)}`}>
                      {c.status === 'in_progress' ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 bg-current`} />
                      )}
                      {c.status.replace('_', ' ')}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {c.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {c.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-border/30">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <div className="p-1.5 bg-muted rounded-lg">{getCategoryIcon(c.category)}</div>
                        {c.category}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground/50">ID: #{c.id}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center glass border-dashed border-2 border-border/50 rounded-[3rem]">
                <p className="text-muted-foreground font-bold italic">No complaints found. All systems operational.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}