'use client'

import dynamic from 'next/dynamic'

// 动态导入Stagewise工具栏，仅在客户端渲染
const StagewiseToolbar = dynamic(
  () => process.env.NODE_ENV === 'development' 
    ? import('@stagewise/toolbar-next').then(mod => mod.StagewiseToolbar)
    : Promise.resolve(() => null),
  { ssr: false }
)

export function StagewiseToolbarWrapper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return <StagewiseToolbar config={{ plugins: [] }} />
}