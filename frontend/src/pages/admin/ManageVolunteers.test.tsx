import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ManageVolunteers from "./ManageVolunteers"

vi.mock("../../actions/useVolunteers", () => ({
  useVolunteerApplications: vi.fn(),
  useUpdateVolunteerStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useExtendVolunteerAccess: () => ({ mutate: vi.fn(), isPending: false }),
  useVolunteerStats: () => ({ data: { active_count: 2, expiring_soon_count: 0, expired_count: 0, total_count: 2, expiring_volunteers: [], warning_days: 7 } }),
  useVolunteerOptions: () => ({ data: { roles: [], event_types: [], status_options: [] } }),
  useToggleMoveApproval: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateVolunteer: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateVolunteer: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("../../contexts/AuthContext.shared", () => ({
  useAuth: () => ({ isAdmin: true, isSeniorVolunteer: false, isJuniorVolunteer: false, isAuthenticated: true, isVolunteer: false }),
}))

const { useVolunteerApplications } = await import("../../actions/useVolunteers")
const mockUseVolunteerApplications = useVolunteerApplications as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <ManageVolunteers />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe("ManageVolunteers", () => {
  it("shows loading state", () => {
    mockUseVolunteerApplications.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderPage()
    expect(screen.getByText("Loading volunteers...")).toBeInTheDocument()
  })

  it("shows volunteer data after loading", () => {
    mockUseVolunteerApplications.mockReturnValue({
      data: [
        { id: 1, name: "Alice", email: "alice@test.com", status: "APPROVED", user_id: 10, requires_move_approval: false, created_at: "2024-01-01" },
        { id: 2, name: "Bob", email: "bob@test.com", status: "PENDING", created_at: "2024-01-02" },
      ],
      isLoading: false,
      isError: false,
    })
    renderPage()
    expect(screen.getByText("Volunteer Management")).toBeInTheDocument()
    // Default tab is "Current Volunteers" (APPROVED)
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("shows error state", () => {
    mockUseVolunteerApplications.mockReturnValue({ data: [], isLoading: false, isError: true })
    renderPage()
    expect(screen.getByText("Failed to load volunteers. Please try again.")).toBeInTheDocument()
  })

  it("shows level badge for approved volunteers", () => {
    mockUseVolunteerApplications.mockReturnValue({
      data: [
        { id: 1, name: "Alice Smith", email: "alice@test.com", status: "APPROVED", user_id: 10, requires_move_approval: false },
        { id: 2, name: "Bob Jones", email: "bob@test.com", status: "APPROVED", user_id: 11, requires_move_approval: true },
      ],
      isLoading: false,
      isError: false,
    })
    renderPage()
    // Badge text for the two volunteers
    expect(screen.getAllByText("Senior").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Junior").length).toBeGreaterThanOrEqual(1)
  })
})
