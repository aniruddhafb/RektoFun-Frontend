'use client'

import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "" // localhost testing only

const solanaAdapter = new SolanaAdapter()

createAppKit({
  adapters: [solanaAdapter],
  networks: [solana, solanaTestnet, solanaDevnet],
  projectId,
  metadata: {
    name: 'RektoFun',
    description: 'PvP Battleground For Predictions',
    url: 'https://rekto.fun',
    icons: ['https://earningrecords.com/assets/1.png']
  },
  features: {
    analytics: true
  }
})

const ReownProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>
}

export default ReownProvider