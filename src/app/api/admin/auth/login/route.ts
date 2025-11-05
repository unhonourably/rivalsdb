import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }
    
    const isValid = await verifyAdminPassword(password)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error verifying admin password:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

