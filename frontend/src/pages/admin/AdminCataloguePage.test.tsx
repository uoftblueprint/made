import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "../../contexts"
import AdminCataloguePage from "./AdminCataloguePage"

const mockGetAll = vi.hoisted(() => vi.fn())

vi.mock("../../api/items.api", () => ({
    itemsApi: { getAll: () => mockGetAll() },
}))

vi.mock("../../api/auth.api", () => ({
    authApi: {
        login: vi.fn(),
        logout: vi.fn(),
        getCurrentUser: vi.fn().mockResolvedValue({
            id: 1, email: "admin@test.com", name: "Admin", role: "ADMIN",
            created_at: "now", requires_move_approval: false,
        }),
    },
}))

vi.mock("../../components/items", () => ({
    AddItemModal: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid="add-modal" /> : null,
    EditItemModal: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid="edit-modal" /> : null,
    DeleteItemDialog: () => null,
    ExportModal: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid="export-modal" /> : null,
}))

beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem("accessToken", "token")
})

function renderPage() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
        <QueryClientProvider client={client}>
            <BrowserRouter>
                <AuthProvider>
                    <AdminCataloguePage />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

describe("AdminCataloguePage", () => {
    it("shows loading then displays items from API", async () => {
        mockGetAll.mockResolvedValue([
            { id: 1, item_code: "G1", title: "Game", platform: "NES", is_on_floor: true, box: null, current_location: null, description: "test", is_public_visible: true, item_type: "HARDWARE", working_condition: true, status: "AVAILABLE", is_verified: true },
        ])

        renderPage()
        expect(screen.getByText("Loading items...")).toBeInTheDocument()
        const items = await screen.findAllByText("Game")
        expect(items.length).toBeGreaterThan(0)
    })

    it("shows error state when API fails", async () => {
        mockGetAll.mockRejectedValue(new Error("API Error"))

        renderPage()
        await waitFor(() => {
            expect(screen.getByText("Failed to load items. Please try again.")).toBeInTheDocument()
        })
    })

    it("opens Add modal when button clicked", async () => {
        mockGetAll.mockResolvedValue([])

        renderPage()
        await waitFor(() => expect(screen.queryByText("Loading items...")).not.toBeInTheDocument())
        fireEvent.click(screen.getByText("Add New Item"))
        expect(screen.getByTestId("add-modal")).toBeInTheDocument()
    })

    it("opens Edit modal when Edit button clicked", async () => {
        mockGetAll.mockResolvedValue([
            { id: 1, item_code: "G1", title: "Game", platform: "NES", is_on_floor: true, box: null, current_location: null, description: "test", is_public_visible: true, item_type: "HARDWARE", working_condition: true, status: "AVAILABLE", is_verified: true },
        ])

        renderPage()
        const editButton = await screen.findByTitle("Edit")
        fireEvent.click(editButton)
        expect(screen.getByTestId("edit-modal")).toBeInTheDocument()
    })
})
