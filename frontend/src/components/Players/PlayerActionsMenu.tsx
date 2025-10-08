import { IconButton } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { PlayerPublic, UserPublic } from "@/client"
import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import DeletePlayer from "./DeletePlayer"
import EditPlayer from "./EditPlayer"

interface PlayerActionsMenuProps {
  player: PlayerPublic
}

export const PlayerActionsMenu = ({ player }: PlayerActionsMenuProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  if (!currentUser?.is_superuser) {
    return null
  }

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton variant="ghost" color="inherit" aria-label="Player actions">
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditPlayer player={player} />
        <DeletePlayer id={player.id} />
      </MenuContent>
    </MenuRoot>
  )
}

export default PlayerActionsMenu
