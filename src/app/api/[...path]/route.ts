import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params
    const pathJoined = path.join('/')
    const { searchParams } = new URL(request.url)
    
    // Build the query string from search params
    const queryString = searchParams.toString()
    const url = `https://pokeapi.co/api/v2/${pathJoined}${queryString ? `?${queryString}` : ''}`
    
    console.log('Proxying request to:', url)
    
    // Forward the request to PokeAPI
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('PokeAPI error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `PokeAPI error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from PokeAPI' },
      { status: 500 }
    )
  }
}
