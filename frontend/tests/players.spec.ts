import { expect, test } from "@playwright/test"

import { firstSuperuser, firstSuperuserPassword } from "./config"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomPassword } from "./utils/random"

const divisions = [
  { id: "div-1", name: "Division Alpha", description: null },
  { id: "div-2", name: "Division Beta", description: null },
]

const groups = [
  { id: "group-1", name: "Group One", division_id: "div-1" },
  { id: "group-2", name: "Group Two", division_id: "div-2" },
]

const setupPlayerRoutes = async (
  page: Parameters<typeof test>[0]["page"],
  players: Array<{
    id: string
    full_name: string
    rating: number
    photo_url: string | null
    division_id: string
    group_id: string | null
  }>,
) => {
  await page.route("**/api/v1/divisions/**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204 })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(divisions),
    })
  })

  await page.route("**/api/v1/division-groups/**", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204 })
      return
    }

    const url = new URL(route.request().url())
    const divisionId = url.searchParams.get("division_id")
    const filtered = divisionId
      ? groups.filter((group) => group.division_id === divisionId)
      : groups

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(filtered),
    })
  })

  await page.route("**/api/v1/players/**", async (route) => {
    const { method } = route.request()

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204 })
      return
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: players, count: players.length }),
      })
      return
    }

    if (method === "POST") {
      const body = route.request().postDataJSON()
      const newPlayer = {
        id: `player-${Date.now()}`,
        full_name: body.full_name,
        rating: body.rating ?? 0,
        photo_url: body.photo_url ?? null,
        division_id: body.division_id,
        group_id: body.group_id ?? null,
      }
      players.push(newPlayer)

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newPlayer),
      })
      return
    }

    await route.continue()
  })
}

test("superuser can create a player card", async ({ page }) => {
  const players: Array<{
    id: string
    full_name: string
    rating: number
    photo_url: string | null
    division_id: string
    group_id: string | null
  }> = []

  await setupPlayerRoutes(page, players)

  await page.goto("/login")
  await page.getByPlaceholder("Email").fill(firstSuperuser)
  await page
    .getByPlaceholder("Password", { exact: true })
    .fill(firstSuperuserPassword)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/")

  await page.goto("/players")
  await expect(page.getByText("No players yet")).toBeVisible()

  await page.getByRole("button", { name: "Add Player" }).click()

  await page.getByPlaceholder("Player name").fill("Alex Pro")
  await page
    .getByPlaceholder("https://example.com/photo.jpg")
    .fill("https://example.com/photo.png")
  const ratingInput = page.getByPlaceholder("1500")
  await ratingInput.fill("")
  await ratingInput.type("1850")
  await page.getByLabel("Division").selectOption("div-1")
  await page.getByLabel("Group").selectOption("group-1")
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByText("Alex Pro")).toBeVisible()
  await expect(page.getByText("Division Alpha")).toBeVisible()
  await expect(page.getByText("Group One")).toBeVisible()
})

test("regular user cannot manage players", async ({ page }) => {
  const email = randomEmail()
  const password = randomPassword()

  await createUser({ email, password })

  const players = [
    {
      id: "player-existing",
      full_name: "Taylor Swift",
      rating: 1720,
      photo_url: null,
      division_id: "div-2",
      group_id: "group-2",
    },
  ]

  await setupPlayerRoutes(page, players)

  await page.goto("/login")
  await page.getByPlaceholder("Email").fill(email)
  await page.getByPlaceholder("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Log In" }).click()
  await page.waitForURL("/")

  await page.goto("/players")

  await expect(page.getByRole("button", { name: "Add Player" })).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Open player actions" }),
  ).toHaveCount(0)
  await expect(page.getByText("Taylor Swift")).toBeVisible()
})
