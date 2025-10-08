import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { Children, cloneElement, isValidElement } from "react"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

vi.mock("@chakra-ui/react", async () => {
  const actual = await vi.importActual<any>("@chakra-ui/react")
  return {
    ...actual,
    Button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    Text: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    VStack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Input: (props: any) => <input {...props} />,
    NativeSelect: {
      Root: ({ children, disabled }: any) => (
        <div>
          {Children.map(children, (child) => {
            if (!isValidElement(child)) {
              return child
            }

            return cloneElement(child as ReactElement<any>, { disabled } as any)
          })}
        </div>
      ),
      Field: ({ children, ...props }: any) => (
        <select {...props}>{children}</select>
      ),
    },
  }
})

vi.mock("@/components/ui/field", () => {
  const Field = ({ label, children, optionalText, required }: any) => {
    const child = Children.only(children)
    const element = isValidElement(child) ? (child as ReactElement) : null
    const controlId = (element?.props as any)?.id

    return (
      <div>
        {label ? (
          <label htmlFor={controlId}>
            {label}
            {!required && optionalText ? ` (${optionalText})` : null}
          </label>
        ) : null}
        {child}
      </div>
    )
  }

  return { Field }
})

vi.mock("@/hooks/useCustomToast", () => ({
  default: () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
  }),
}))

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

import { ChakraProvider } from "@chakra-ui/react"
import type { Division, DivisionGroup } from "@/client/players-extra"
import { system } from "@/theme"
import PlayerForm, { type PlayerFormValues } from "../PlayerForm"

describe("PlayerForm", () => {
  const divisions: Division[] = [
    { id: "div-1", name: "Division 1", description: null },
    { id: "div-2", name: "Division 2", description: null },
  ]

  const divisionGroups: DivisionGroup[] = [
    { id: "group-1", name: "Group A", division_id: "div-1" },
    { id: "group-2", name: "Group B", division_id: "div-1" },
    { id: "group-3", name: "Group C", division_id: "div-2" },
  ]

  const defaultValues: PlayerFormValues = {
    full_name: "",
    photo_url: "",
    rating: 1500,
    division_id: "",
    group_id: "",
  }

  const renderComponent = (overrides: Partial<PlayerFormValues> = {}) => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    const utils = render(
      <ChakraProvider value={system}>
        <PlayerForm
          initialValues={{ ...defaultValues, ...overrides }}
          divisions={divisions}
          divisionGroups={divisionGroups}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitLabel="Save"
          description="Provide details"
        />
      </ChakraProvider>,
    )

    return {
      onSubmit,
      onCancel,
      ...utils,
    }
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("validates and submits player data", async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderComponent()

    const saveButton = screen.getByRole("button", { name: "Save" })
    expect(saveButton).toBeDisabled()

    await user.type(screen.getByPlaceholderText(/player name/i), "John Doe")
    await user.type(
      screen.getByPlaceholderText("https://example.com/photo.jpg"),
      "https://example.com/photo.jpg",
    )
    await user.clear(screen.getByPlaceholderText("1500"))
    await user.type(screen.getByPlaceholderText("1500"), "1600")
    await user.selectOptions(screen.getByLabelText(/division/i), "div-1")
    await user.selectOptions(screen.getByLabelText(/group/i), "group-1")

    await user.click(saveButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    const [submittedValues] = onSubmit.mock.calls[0]
    expect(submittedValues).toEqual({
      full_name: "John Doe",
      photo_url: "https://example.com/photo.jpg",
      rating: 1600,
      division_id: "div-1",
      group_id: "group-1",
    })
  })

  test("resets and calls onCancel when cancel is pressed", async () => {
    const user = userEvent.setup()
    const { onCancel } = renderComponent({ full_name: "Existing" })

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalled()
  })
})
