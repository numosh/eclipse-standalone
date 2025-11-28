'use client'

import React from 'react'
import { ResponsiveSankey } from '@nivo/sankey'

interface SankeyNode {
  id: string
  color?: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyDiagramProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  title?: string
  height?: number
}

export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
  title,
  height = 500
}) => {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>}
      <div style={{ height: `${height}px` }} className="bg-white rounded-lg p-4">
        <ResponsiveSankey
          data={{ nodes, links }}
          margin={{ top: 20, right: 160, bottom: 20, left: 160 }}
          align="justify"
          colors={{ scheme: 'category10' }}
          nodeOpacity={1}
          nodeHoverOthersOpacity={0.35}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{
            from: 'color',
            modifiers: [['darker', 0.8]]
          }}
          nodeBorderRadius={3}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          linkContract={3}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={16}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1]]
          }}
        />
      </div>
    </div>
  )
}
