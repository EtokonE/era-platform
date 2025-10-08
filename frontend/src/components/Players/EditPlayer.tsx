import {
  Button,
  ButtonGroup,
  chakra,
  DialogActionTrigger,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaExchangeAlt } from "react-icons/fa"

import { type PlayerPublic, PlayersService, type UserPublic } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { useDivisionGroups, useDivisions } from "@/hooks/useDivisions"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface EditPlayerProps {
  player: PlayerPublic
}

interface PlayerUpdateForm {
  full_name: string
  photo_url?: string
  rating: number
  division_id: string
  group_id?: string
}

const SelectField = chakra("select")

const EditPlayer = ({ player }: EditPlayerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { showSuccessToast } = useCustomToast()
  const divisionFieldId = useId()
  const groupFieldId = useId()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlayerUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: player.full_name,
      photo_url: player.photo_url ?? undefined,
      rating: player.rating ?? 0,
      division_id: player.division_id,
      group_id: player.group_id ?? undefined,
    },
  })

  const selectedDivisionId = watch("division_id")

  const { data: divisionsData } = useDivisions()
  const { data: groupsData } = useDivisionGroups(selectedDivisionId)

  const mutation = useMutation({
    mutationFn: (data: PlayerUpdateForm) =>
      PlayersService.updatePlayer({
        playerId: player.id,
        requestBody: {
          ...data,
          photo_url: data.photo_url || undefined,
          group_id: data.group_id || undefined,
        },
      }),
    onSuccess: () => {
      showSuccessToast("Player updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: handleError,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] })
    },
  })

  const onSubmit: SubmitHandler<PlayerUpdateForm> = async (data) => {
    await mutation.mutateAsync(data)
  }

  if (!currentUser?.is_superuser) {
    return null
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Player
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the player details below.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.full_name}
                errorText={errors.full_name?.message}
                label="Full Name"
              >
                <Input
                  {...register("full_name", {
                    required: "Full name is required.",
                  })}
                  placeholder="Full name"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.photo_url}
                errorText={errors.photo_url?.message}
                label="Photo URL"
              >
                <Input
                  {...register("photo_url")}
                  placeholder="https://example.com/photo.jpg"
                  type="url"
                />
              </Field>

              <Field
                required
                invalid={!!errors.rating}
                errorText={errors.rating?.message}
                label="Rating"
              >
                <Input
                  {...register("rating", {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Rating must be a non-negative number.",
                    },
                  })}
                  placeholder="0"
                  type="number"
                />
              </Field>

              <Field
                required
                invalid={!!errors.division_id}
                errorText={errors.division_id?.message}
                label="Division"
              >
                <SelectField
                  id={divisionFieldId}
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  {...register("division_id", {
                    required: "Division is required.",
                  })}
                >
                  <option value="">Select a division</option>
                  {divisionsData?.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </SelectField>
              </Field>

              <Field
                invalid={!!errors.group_id}
                errorText={errors.group_id?.message}
                label="Group"
              >
                <SelectField
                  id={groupFieldId}
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  {...register("group_id")}
                >
                  <option value="">No group</option>
                  {groupsData?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </SelectField>
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting}>
                Save
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditPlayer
