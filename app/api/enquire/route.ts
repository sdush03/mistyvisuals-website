import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export async function POST(request: NextRequest) {
  let client;
  
  try {
    const body = await request.json()
    const { name, email, phone, instagram, date, venue, message, coverageScope } = body

    // 1. Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is a required field.' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is a required field.' }, { status: 400 })
    }

    // 2. Database Connection
    const pool = getDbPool()
    client = await pool.connect()

    // 3. Start Transaction
    await client.query('BEGIN')

    // Insert into leads table
    const leadQuery = `
      INSERT INTO leads (
        name, source, status, phone_primary, email, instagram,
        potential, important, coverage_scope, intake_completed
      )
      VALUES ($1, 'Website', 'New', $2, $3, $4, false, false, $5, false)
      RETURNING id;
    `
    const leadValues = [
      name.trim(),
      phone.trim(),
      email ? email.trim() : null,
      instagram ? instagram.trim() : null,
      coverageScope || 'Both Sides'
    ]

    const leadResult = await client.query(leadQuery, leadValues)
    const leadId = leadResult.rows[0].id

    // Insert into lead_events table
    const eventQuery = `
      INSERT INTO lead_events (
        lead_id, event_type, event_date, venue, description
      )
      VALUES ($1, 'Wedding', $2, $3, $4);
    `
    const parsedDate = date ? new Date(date) : null
    const eventValues = [
      leadId,
      parsedDate,
      venue ? venue.trim() : null,
      message ? message.trim() : null
    ]

    await client.query(eventQuery, eventValues)

    // Commit Transaction
    await client.query('COMMIT')

    console.log(`Inquiry successfully recorded in OS database. Lead ID: ${leadId}`)
    return NextResponse.json({ success: true, leadId })

  } catch (error: any) {
    console.error('Error recording inquiry in database:', error)
    
    // Rollback on error if connection was established
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackErr) {
        console.error('Database transaction rollback failed:', rollbackErr)
      }
    }

    return NextResponse.json({ 
      error: 'An internal server error occurred while submitting your inquiry. Please try again or reach out directly.' 
    }, { status: 500 })

  } finally {
    // Release client back to the pool
    if (client) {
      client.release()
    }
  }
}
