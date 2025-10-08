import { Button, DialogTitle } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { FaPlus } from "react-icons/fa"

import { type PlayerCreate, PlayersService } from "@/client"
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

interface AddPlayerProps {
  canManagePlayers: boolean
  divisions: Division[]
  divisionGroups: DivisionGroup[]
  isLoading?: boolean
}

const defaultValues: PlayerFormValues = {
  full_name: "",
  photo_url: "",
  rating: 1500,
  division_id: "",
  group_id: "",
}

const AddPlayer = ({
  canManagePlayers,
  divisions,
  divisionGroups,
  isLoading,
}: AddPlayerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [formValues, setFormValues] = useState<PlayerFormValues>(defaultValues)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const availableDivisions = useMemo(() => divisions, [divisions])
  const availableGroups = useMemo(() => divisionGroups, [divisionGroups])

  const mutation = useMutation({
    mutationFn: (payload: PlayerCreate) =>
      PlayersService.createPlayer({ requestBody: payload }),
    onSuccess: () => {
      showSuccessToast("Player created successfully.")
      setFormValues(defaultValues)
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
    const ratingValue =
      typeof values.rating === "number" && Number.isFinite(values.rating)
        ? values.rating
        : undefined

    const payload: PlayerCreate = {
      full_name: values.full_name.trim(),
      rating: ratingValue,
      photo_url: values.photo_url.trim() ? values.photo_url.trim() : undefined,
      division_id: values.division_id,
      group_id: values.group_id ? values.group_id : undefined,
    }

    mutation.mutate(payload)
  }

  const handleCancel = () => {
    setFormValues(defaultValues)
    setIsOpen(false)
  }

  if (!canManagePlayers) {
    return null
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        setIsOpen(open)
        if (!open) {
          setFormValues(defaultValues)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button value="add-player" my={4} disabled={isLoading}>
          <FaPlus fontSize="16px" />
          Add Player
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <PlayerForm
            initialValues={formValues}
            divisions={availableDivisions}
            divisionGroups={availableGroups}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Save"
            description="Provide the player details below."
            isBusy={mutation.isPending}
            disableSubmit={Boolean(isLoading || divisions.length === 0)}
          />
        </DialogBody>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddPlayer
