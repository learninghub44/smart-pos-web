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
  const user = getCurrentAuthUser()
  const [activeBranchId, setLocalBranchId] = useState<string | null>(() => getActiveBranchId())
  const [branches, setBranches] = useState<Branch[]>([])
  const owner = isOwner(user)

  useEffect(() => {
    if (owner) loadBranches()
  }, [owner])

  const loadBranches = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('branches').select('*').eq('is_active', true).order('name')
      if (data) setBranches(data)
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
    activeBranchId,       // null = all branches (owner only)
    activeBranchName,
    branches,
    switchBranch,
    reloadBranches: loadBranches,
  }
}
