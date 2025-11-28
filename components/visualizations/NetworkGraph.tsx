'use client'

import React from 'react'
import { ResponsiveNetwork } from '@nivo/network'

interface NetworkNode {
  id: string
  color?: string
  size?: number
}

interface NetworkLink {
  source: string
  target: string
  distance?: number
}

interface NetworkGraphProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  title?: string
  height?: number
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  links,
  title,
  height = 600
}) => {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div style={{ height: `${height}px` }}>
        <ResponsiveNetwork
          data={{ nodes, links }}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          linkDistance={(e) => e.distance || 80}
          centeringStrength={0.3}
          repulsivity={6}
          nodeSize={(n) => (n.size || 12)}
          activeNodeSize={(n) => (n.size || 12) * 1.5}
          nodeColor={(n) => n.color || '#8B5CF6'}
          nodeBorderWidth={1}
          nodeBorderColor={{
            from: 'color',
            modifiers: [['darker', 0.8]]
          }}
          linkThickness={(n) => 2}
          linkBlendMode="multiply"
          motionConfig="gentle"
          annotations={[]}
        />
      </div>
    </div>
  )
}
