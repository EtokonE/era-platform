import { Button, Input, NativeSelect, Text, VStack } from "@chakra-ui/react"
import { useEffect, useId, useMemo } from "react"
import { useForm } from "react-hook-form"

import type { Division, DivisionGroup } from "@/client/players-extra"
import { Field } from "@/components/ui/field"

export type PlayerFormValues = {
  full_name: string
  photo_url: string
  rating: number | null
  division_id: string
  group_id: string
}

interface PlayerFormProps {
  initialValues: PlayerFormValues
  divisions: Division[]
  divisionGroups: DivisionGroup[]
  onSubmit: (values: PlayerFormValues) => void | Promise<void>
  onCancel: () => void
  submitLabel: string
  description: string
  isBusy?: boolean
  disableSubmit?: boolean
}

const PlayerForm = ({
  initialValues,
  divisions,
  divisionGroups,
  onSubmit,
  onCancel,
  submitLabel,
  description,
  isBusy = false,
  disableSubmit = false,
}: PlayerFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<PlayerFormValues>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: initialValues,
  })

  const formInstanceId = useId()

  const fieldIds = useMemo(
    () => ({
      fullName: `${formInstanceId}-full-name`,
      photoUrl: `${formInstanceId}-photo-url`,
      rating: `${formInstanceId}-rating`,
      division: `${formInstanceId}-division`,
      group: `${formInstanceId}-group`,
    }),
    [formInstanceId],
  )

  useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  const selectedDivision = watch("division_id")
  const selectedGroup = watch("group_id")

  const availableGroups = useMemo(() => {
    if (!selectedDivision) {
      return [] as DivisionGroup[]
    }
    return divisionGroups.filter(
      (group) => group.division_id === selectedDivision,
    )
  }, [divisionGroups, selectedDivision])

  useEffect(() => {
    if (!selectedDivision) {
      setValue("group_id", "", { shouldDirty: true, shouldValidate: true })
      return
    }

    if (!availableGroups.some((group) => group.id === selectedGroup)) {
      setValue("group_id", "", { shouldDirty: true, shouldValidate: true })
    }
  }, [availableGroups, selectedDivision, selectedGroup, setValue])

  const handleCancel = () => {
    reset(initialValues)
    onCancel()
  }

  const handleFormSubmit = handleSubmit(onSubmit)

  return (
    <form onSubmit={handleFormSubmit}>
      <Text mb={4}>{description}</Text>
      <VStack gap={4} align="stretch">
        <Field
          required
          invalid={!!errors.full_name}
          errorText={errors.full_name?.message}
          label="Full Name"
        >
          <Input
            id={fieldIds.fullName}
            {...register("full_name", {
              required: "Full name is required.",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters.",
              },
            })}
            placeholder="Player name"
            type="text"
          />
        </Field>

        <Field
          invalid={!!errors.photo_url}
          errorText={errors.photo_url?.message}
          label="Photo URL"
          optionalText="Optional"
        >
          <Input
            id={fieldIds.photoUrl}
            {...register("photo_url", {
              validate: (value) => {
                if (!value) return true
                try {
                  new URL(value)
                  return true
                } catch {
                  return "Enter a valid URL."
                }
              },
            })}
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
            id={fieldIds.rating}
            {...register("rating", {
              required: "Rating is required.",
              valueAsNumber: true,
              min: { value: 0, message: "Rating must be 0 or higher." },
            })}
            placeholder="1500"
            type="number"
            min={0}
          />
        </Field>

        <Field
          required
          invalid={!!errors.division_id}
          errorText={errors.division_id?.message}
          label="Division"
        >
          <NativeSelect.Root disabled={divisions.length === 0}>
            <NativeSelect.Field
              id={fieldIds.division}
              aria-label="Division"
              data-testid="division-select"
              placeholder="Select a division"
              {...register("division_id", {
                required: "Select a division.",
              })}
            >
              <option value="" disabled hidden>
                Select a division
              </option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field>

        <Field
          invalid={!!errors.group_id}
          errorText={errors.group_id?.message}
          label="Group"
          optionalText={availableGroups.length === 0 ? "Optional" : undefined}
        >
          <NativeSelect.Root
            disabled={!selectedDivision || availableGroups.length === 0}
          >
            <NativeSelect.Field
              id={fieldIds.group}
              aria-label="Group"
              data-testid="group-select"
              placeholder={
                availableGroups.length > 0
                  ? "Select a group"
                  : "No groups available"
              }
              {...register("group_id")}
            >
              <option value="">No group</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Field>
      </VStack>

      <VStack gap={2} align="stretch" mt={6}>
        <Button
          variant="solid"
          type="submit"
          disabled={!isValid || disableSubmit}
          loading={isSubmitting || isBusy}
        >
          {submitLabel}
        </Button>
        <Button
          variant="subtle"
          colorPalette="gray"
          type="button"
          disabled={isSubmitting || isBusy}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </VStack>
    </form>
  )
}

export default PlayerForm
