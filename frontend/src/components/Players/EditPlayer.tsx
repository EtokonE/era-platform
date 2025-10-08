import { Button, DialogTitle } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { FaPen } from "react-icons/fa"

import { type PlayerPublic, PlayersService, type PlayerUpdate } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import type { Division, DivisionGroup } from "@/client/players-extra"
import PlayerForm, {
  type PlayerFormValues,
} from "@/components/Players/PlayerForm"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

interface EditPlayerProps {
  player: PlayerPublic
  divisions: Division[]
  divisionGroups: DivisionGroup[]
  isDisabled?: boolean
}

const mapPlayerToFormValues = (player: PlayerPublic): PlayerFormValues => ({
  full_name: player.full_name,
  photo_url: player.photo_url ?? "",
  rating: player.rating ?? null,
  division_id: player.division_id,
  group_id: player.group_id ?? "",
})

const EditPlayer = ({
  player,
  divisions,
  divisionGroups,
  isDisabled,
}: EditPlayerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [formValues, setFormValues] = useState<PlayerFormValues>(
    mapPlayerToFormValues(player),
  )
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const availableDivisions = useMemo(() => divisions, [divisions])
  const availableGroups = useMemo(() => divisionGroups, [divisionGroups])

  const mutation = useMutation({
    mutationFn: (payload: PlayerUpdate) =>
      PlayersService.updatePlayer({
        playerId: player.id,
        requestBody: payload,
      }),
    onSuccess: () => {
      showSuccessToast("Player updated successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] })
    },
  })

  const handleSubmit = (values: PlayerFormValues) => {
    const payload: PlayerUpdate = {
      full_name: values.full_name.trim() || undefined,
      rating:
        values.rating === null || Number.isNaN(values.rating)
          ? undefined
          : Number(values.rating),
      photo_url: values.photo_url.trim() ? values.photo_url.trim() : null,
      division_id: values.division_id,
      group_id: values.group_id ? values.group_id : null,
    }

    mutation.mutate(payload)
  }

  const handleCancel = () => {
    setFormValues(mapPlayerToFormValues(player))
    setIsOpen(false)
  }

  const handleOpenChange = ({ open }: { open: boolean }) => {
    setIsOpen(open)
    if (open) {
      setFormValues(mapPlayerToFormValues(player))
    }
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDisabled}>
          <FaPen fontSize="14px" />
          Edit Player
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <PlayerForm
            initialValues={formValues}
            divisions={availableDivisions}
            divisionGroups={availableGroups}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Save"
            description="Update the player details below."
            isBusy={mutation.isPending}
          />
        </DialogBody>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditPlayer
