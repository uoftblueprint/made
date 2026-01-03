import { it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import VolunteerApplication from "./VolunteerApplication"

const postMock = vi.hoisted(()=>vi.fn()) // does nothing except count calls
vi.mock("../../api/index", () => ({
  apiClient: {
    post: postMock,
  },
}))

beforeEach(() => {
  postMock.mockReset()
})

<<<<<<< HEAD
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

it("does not submit when form is invalid", async () => {
  renderWithQueryClient(<VolunteerApplication />)

  const user = userEvent.setup()

  await user.click(screen.getByRole("button", { name: /submit/i }))
=======
it("does not submit when form is invalid", async () => {
  render(<VolunteerApplication />)

  const user = userEvent.setup()

  await user.click(
    screen.getByRole("button", { name: /submit/i })
  )
>>>>>>> 85fea04 (added some tests)

  expect(postMock).not.toHaveBeenCalled()
})

<<<<<<< HEAD
it("submits when valid, shows loading message when pending, created correct payload", async () => {
  renderWithQueryClient(<VolunteerApplication />)

  const user = userEvent.setup()

  await user.type(screen.getByLabelText(/First Name/i), "Bob")
  await user.type(screen.getByLabelText(/Last Name/i), "Vladmir")
  await user.type(screen.getByLabelText(/Email/i), "edw22@gmail.com")
  await user.type(screen.getByLabelText(/Phone Number/i), "(416) 622-6983")
  await user.type(screen.getByLabelText(/Why do you want to volunteer\?/i), "i want to help")

  let resolvePost: (value?: unknown) => void = () => {}
  const pendingPromise = new Promise((res) => {
    resolvePost = res
  })

  postMock.mockReturnValueOnce(pendingPromise)

  await user.click(screen.getByRole("button", { name: /submit/i }))

  expect(await screen.findByRole("button", { name: /submitting/i })).toBeInTheDocument()

  expect(postMock).toHaveBeenCalledTimes(1)
  expect(postMock).toHaveBeenCalledWith("/api/volunteer-applications/", {
    name: "Bob Vladmir",
    email: "edw22@gmail.com",
    motivation_text: "i want to help",
  })

  resolvePost({})
=======
it("submits when valid, shows loading message when pending, created correct payload", async () =>{
    render(<VolunteerApplication/>)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/First Name/i), "Bob")
    await user.type(screen.getByLabelText(/Last Name/i), "Vladmir")
    await user.type(screen.getByLabelText(/Email/i), "edw22@gmail.com")
    await user.type(screen.getByLabelText(/Phone Number/i), "(416) 622-6983")
    await user.type(screen.getByLabelText(/Why do you want to volunteer\?/i), "i want to help")
    
    let resolvePost: (value?: unknown) => void = () => {}
    const pendingPromise = new Promise((res) => {
        resolvePost = res
    })
    postMock.mockReturnValueOnce(pendingPromise)
    await user.click(screen.getByRole("button", { name: /submit/i }))
    expect(screen.getByRole("button", { name: /submitting/i })).toBeInTheDocument()

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith("/api/volunteer-applications/", {
        name: "Bob Vladmir",
        email: "edw22@gmail.com",
        motivation_text: "i want to help",
    })
    
    resolvePost({})
>>>>>>> 85fea04 (added some tests)
})