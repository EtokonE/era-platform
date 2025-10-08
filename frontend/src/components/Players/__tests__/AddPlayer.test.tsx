import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import {
  Children,
  cloneElement,
  createContext,
  type ReactElement,
  useContext,
  useState,
} from "react"
import { vi } from "vitest"

import {
  DivisionsService,
  type PlayerPublic,
  PlayersService,
  type UserPublic,
} from "@/client"
import { CustomProvider } from "@/components/ui/provider"

import AddPlayer from "../AddPlayer"

vi.mock("@/hooks/useCustomToast", () => ({
  default: () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
  }),
}))

vi.mock("@chakra-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@chakra-ui/react")>()
  return {
    ...actual,
    Button: (props: any) => <button {...props} />,
    Input: (props: any) => <input {...props} />,
    Select: (props: any) => <select {...props} />,
    Text: ({ children }: any) => <p>{children}</p>,
    VStack: ({ children }: any) => <div>{children}</div>,
  }
})

vi.mock("@/components/ui/field", () => ({
  Field: ({ label, children }: any) => {
    if (!children) {
      return null
    }
    const controlId = children.props?.id ?? children.props?.name ?? "field"
    return (
      <label htmlFor={controlId}>
        {label}
        {children.props?.id
          ? children
          : cloneElement(children, { id: controlId })}
      </label>
    )
  },
}))

vi.mock("@/components/ui/dialog", () => {
  const DialogContext = createContext({
    open: false,
    setOpen: (_open: boolean) => {},
  })

  const DialogRoot = ({ children, open = false, onOpenChange }: any) => {
    const [isOpen, setIsOpen] = useState(open)
    const setOpen = (next: boolean) => {
      onOpenChange?.({ open: next })
      setIsOpen(next)
    }
    return (
      <DialogContext.Provider value={{ open: isOpen, setOpen }}>
        {typeof children === "function" ? children({ open: isOpen }) : children}
      </DialogContext.Provider>
    )
  }

  const wrapChild = (child: ReactElement, toggle: () => void) =>
    cloneElement(Children.only(child), {
      ...child.props,
      onClick: (...args: any[]) => {
        child.props?.onClick?.(...args)
        toggle()
      },
    })

  const DialogTrigger = ({ children }: any) => {
    const { setOpen } = useContext(DialogContext)
    return wrapChild(children, () => setOpen(true))
  }

  const DialogActionTrigger = ({ children }: any) => {
    const { setOpen } = useContext(DialogContext)
    return wrapChild(children, () => setOpen(false))
  }

  const DialogContent = ({ children }: any) => {
    const { open } = useContext(DialogContext)
    if (!open) return null
    return <div role="dialog">{children}</div>
  }

  const passthrough = ({ children }: any) => <div>{children}</div>

  return {
    DialogRoot,
    DialogTrigger,
    DialogContent,
    DialogActionTrigger,
    DialogBody: passthrough,
    DialogHeader: passthrough,
    DialogFooter: passthrough,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogCloseTrigger: () => null,
  }
})

describe("AddPlayer", () => {
  const division = {
    id: "division-1",
    name: "Open Division",
    description: null,
  }
  const group = { id: "group-1", name: "Group A", division_id: division.id }
  const playerResponse: PlayerPublic = {
    id: "player-1",
    full_name: "Test Player",
    division_id: division.id,
    group_id: group.id,
    photo_url: "https://example.com/photo.jpg",
    rating: 1200,
  }

  const renderComponent = async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData<UserPublic>(["currentUser"], {
      id: "user-1",
      email: "admin@example.com",
      is_superuser: true,
      is_active: true,
      full_name: "Admin",
    })

    const divisionsSpy = vi
      .spyOn(DivisionsService, "listDivisions")
      .mockResolvedValue([division])
    const divisionGroupsSpy = vi
      .spyOn(DivisionsService, "listDivisionGroups")
      .mockResolvedValue([group])
    const createPlayerSpy = vi
      .spyOn(PlayersService, "createPlayer")
      .mockResolvedValue(playerResponse)

    render(
      <QueryClientProvider client={queryClient}>
        <CustomProvider>
          <AddPlayer />
        </CustomProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => expect(divisionsSpy).toHaveBeenCalled())

    return { createPlayerSpy, divisionGroupsSpy }
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("validates inputs and submits new player", async () => {
    const { createPlayerSpy, divisionGroupsSpy } = await renderComponent()

    const openDialogButton = screen.getByRole("button", { name: /add player/i })
    fireEvent.click(openDialogButton)

    const dialog = await screen.findByRole("dialog")
    const saveButton = within(dialog).getByRole("button", { name: /save/i })
    expect(saveButton).toBeDisabled()

    const nameInput = within(dialog).getByPlaceholderText("Full name")
    fireEvent.change(nameInput, { target: { value: "Test Player" } })
    fireEvent.blur(nameInput)
    const photoInput = within(dialog).getByPlaceholderText(
      "https://example.com/photo.jpg",
    )
    fireEvent.change(photoInput, {
      target: { value: "https://example.com/photo.jpg" },
    })
    fireEvent.blur(photoInput)
    const ratingInput = within(dialog).getByPlaceholderText("0")
    fireEvent.change(ratingInput, { target: { value: "1200" } })
    fireEvent.blur(ratingInput)

    const divisionSelect = within(dialog).getByLabelText("Division")
    fireEvent.change(divisionSelect, { target: { value: division.id } })
    fireEvent.blur(divisionSelect)

    await waitFor(() =>
      expect(divisionGroupsSpy).toHaveBeenCalledWith({
        divisionId: division.id,
      }),
    )

    const groupSelect = within(dialog).getByLabelText("Group")
    fireEvent.change(groupSelect, { target: { value: group.id } })
    fireEvent.blur(groupSelect)

    await waitFor(() => expect(saveButton).toBeEnabled())

    fireEvent.click(saveButton)

    await waitFor(() =>
      expect(createPlayerSpy).toHaveBeenCalledWith({
        requestBody: expect.objectContaining({
          full_name: "Test Player",
          photo_url: "https://example.com/photo.jpg",
          rating: 1200,
          division_id: division.id,
        }),
      }),
    )
  })
})
