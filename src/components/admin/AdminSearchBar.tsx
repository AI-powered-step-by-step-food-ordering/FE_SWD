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
      <i className="bx bx-search absolute left-3 top-2.5 text-gray-400 text-[20px]" aria-hidden="true"></i>
    </div>
  )
}