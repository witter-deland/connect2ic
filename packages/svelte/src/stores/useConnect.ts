import { useSelector } from "@xstate/svelte"
import { getContext, onMount } from "svelte"
import { contextKey } from "../context"
import type { ContextState } from "../context"
import { derived, readable } from "svelte/store"
import type { Readable } from "svelte/store"
import { useEffect } from "react"

type Props = {
  onConnect?: () => void
  onDisconnect?: () => void
}

const useConnect = (props: Props = {}) => {
  const {
    onConnect = () => {
    },
    onDisconnect = () => {
    },
  } = props
  const { client } = getContext<ContextState>(contextKey)
  const principal = useSelector(client._service, state => state.context.principal)
  const activeProvider = useSelector(client._service, state => state.context.activeProvider)
  const state = useSelector(client._service, state => state)
  // @ts-ignore
  const status = useSelector(client._service, state => state.value.idle)
  const isConnected: Readable<boolean> = derived(state, ($state, set) => {
    set($state.matches({ idle: "connected" }) ?? false)
  })
  const isConnecting: Readable<boolean> = derived(state, ($state, set) => set($state.matches({ idle: "connecting" }) ?? false))
  const isInitializing: Readable<boolean> = derived(state, ($state, set) => set($state.matches({ idle: "intializing" }) ?? false))
  const isDisconnecting: Readable<boolean> = derived(state, ($state, set) => set($state.matches({ idle: "disconnecting" }) ?? false))
  const isIdle: Readable<boolean> = derived(state, ($state, set) => set($state.matches({ idle: "idle" }) ?? false))

  onMount(() => {
    const unsub = client.on("connect", onConnect)
    const unsub2 = client.on("disconnect", onDisconnect)
    return () => {
      unsub()
      unsub2()
    }
  })

  return {
    principal,
    status,
    activeProvider,
    isInitializing,
    isConnected,
    isConnecting,
    isDisconnecting,
    isIdle,
    connect: (provider) => {
      client._service.send({ type: "CONNECT", data: { provider } })
    },
    disconnect: () => {
      client._service.send({ type: "DISCONNECT" })
    },
  }
}

export { useConnect }