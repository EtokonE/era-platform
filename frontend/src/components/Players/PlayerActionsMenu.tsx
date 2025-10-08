import { IconButton } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { BsThreeDotsVertical } from "react-icons/bs"

import type { PlayerPublic, UserPublic } from "@/client"
import type { Division, DivisionGroup } from "@/client/players-extra"

import { MenuContent, MenuRoot, MenuTrigger } from "../ui/menu"
import DeletePlayer from "./DeletePlayer"
import EditPlayer from "./EditPlayer"

interface PlayerActionsMenuProps {
  player: PlayerPublic
  divisions: Division[]
  divisionGroups: DivisionGroup[]
  isDisabled?: boolean
}

const PlayerActionsMenu = ({
  player,
  divisions,
  divisionGroups,
  isDisabled,
}: PlayerActionsMenuProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  if (!currentUser?.is_superuser) {
    return null
  }

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <IconButton
          variant="ghost"
          color="inherit"
          disabled={isDisabled}
          aria-label="Open player actions"
        >
          <BsThreeDotsVertical />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        <EditPlayer
          player={player}
          divisions={divisions}
          divisionGroups={divisionGroups}
          isDisabled={isDisabled}
        />
        <DeletePlayer
          playerId={player.id}
          playerName={player.full_name}
          isDisabled={isDisabled}
        />
      </MenuContent>
    </MenuRoot>
  )
}

export default PlayerActionsMenu
