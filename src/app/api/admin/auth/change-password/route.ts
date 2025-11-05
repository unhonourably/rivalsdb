import { NextRequest, NextResponse } from 'next/server'
import { changeAdminPassword } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { oldPassword, newPassword } = await request.json()
    
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 })
    }
    
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }
    
    const success = await changeAdminPassword(oldPassword, newPassword)
    
    if (!success) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing admin password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}

