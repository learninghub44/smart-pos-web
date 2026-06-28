'use client'
import { useState, useEffect, useCallback } from 'react'
import { getCurrentAuthUser, getActiveBranchId, setActiveBranchId, isOwner } from '@/lib/auth'

export interface Branch {
  id: string
  name: string
  location: string | null
  phone: string | null
  email: string | null
  is_active: boolean
}

export function useBranch() {
  const [user, setUser] = useState<import('@/lib/auth').User | null>(null)
  const [activeBranchId, setLocalBranchId] = useState<string | null>(() => getActiveBranchId())
  const [branches, setBranches] = useState<Branch[]>([])
  const owner = isOwner(user)

  useEffect(() => {
    getCurrentAuthUser().then(setUser)
  }, [])

  useEffect(() => {
    if (owner) loadBranches()
  }, [owner])

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/branches')
      if (res.ok) {
        const data = await res.json()
        setBranches((data.data ?? data).filter((b: Branch) => b.is_active))
      }
    } catch (_) {}
  }

  const switchBranch = useCallback((branchId: string | null) => {
    setActiveBranchId(branchId)
    setLocalBranchId(branchId)
  }, [])

  const activeBranch = branches.find(b => b.id === activeBranchId) || null
  const activeBranchName = user?.branch_name || activeBranch?.name || (activeBranchId ? '...' : 'All Branches')

  return {
    user,
    owner,
    activeBranchId,
    activeBranchName,
    branches,
    switchBranch,
    reloadBranches: loadBranches,
  }
}
