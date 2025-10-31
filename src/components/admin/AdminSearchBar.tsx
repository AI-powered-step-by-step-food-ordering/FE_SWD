'use client'

import React from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function AdminSearchBar({ value, onChange, placeholder = 'Tìm kiếm...' }: Props) {
  return (
    <div className="relative w-64">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 6a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
    </div>
  )
}