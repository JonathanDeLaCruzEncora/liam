'use client'

import { CookieConsent } from '@/components/CookieConsent'
import type { DBStructure, ProcessError } from '@liam-hq/db-structure'
import {
  ERDRenderer,
  VersionProvider,
  initDBStructureStore,
  versionSchema,
} from '@liam-hq/erd-core'
import { useEffect } from 'react'
import * as v from 'valibot'

type ErrorObject = {
  name: string
  message: string
}

type ERDViewerProps = {
  dbStructure: DBStructure
  errorObjects: ErrorObject[]
  defaultSidebarOpen: boolean
}

export default function ERDViewer({
  dbStructure,
  errorObjects,
  defaultSidebarOpen,
}: ERDViewerProps) {
  useEffect(() => {
    initDBStructureStore(dbStructure)
  }, [dbStructure])

  const versionData = {
    version: '0.1.0', // NOTE: no maintained version for ERD Web
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    envName: process.env.NEXT_PUBLIC_ENV_NAME,
    date: process.env.NEXT_PUBLIC_RELEASE_DATE,
    displayedOn: 'web',
  }
  const version = v.parse(versionSchema, versionData)
  const isIframe = window !== window.parent

  return (
    <div style={{ height: '100vh' }}>
      <VersionProvider version={version}>
        <ERDRenderer
          defaultSidebarOpen={defaultSidebarOpen}
          errorObjects={errorObjects}
        />
      </VersionProvider>
      {process.env.NEXT_PUBLIC_ENV_NAME !== 'production' && !isIframe && (
        <CookieConsent />
      )}
    </div>
  )
}
