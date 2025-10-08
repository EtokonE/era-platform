import { expect, test } from "@playwright/test"

import { firstSuperuser, firstSuperuserPassword } from "./config.ts"
import { randomEmail, randomPassword, randomTeamName } from "./utils/random.ts"
import { logInUser, logOutUser, signUpNewUser } from "./utils/user.ts"

test.describe
  .serial("Players page", () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test("superuser can create a new player", async ({ page }) => {
      const playerName = randomTeamName()

      await logInUser(page, firstSuperuser, firstSuperuserPassword)
      await page.goto("/players")

      await expect(page.getByRole("heading", { name: "Players" })).toBeVisible()
      await page.getByRole("button", { name: "Add Player" }).click()

      const dialog = page.getByRole("dialog")
      await dialog.getByPlaceholder("Full name").fill(playerName)
      await dialog
        .getByPlaceholder("https://example.com/photo.jpg")
        .fill("https://example.com/test.jpg")
      await dialog.getByPlaceholder("0").fill("1200")

      await dialog.getByLabel("Division").selectOption({ index: 1 })
      await dialog.getByLabel("Group").selectOption({ index: 1 })

      await dialog.getByRole("button", { name: "Save" }).click()

      await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 })
      await expect(page.getByText(playerName)).toBeVisible()
      await expect(page.getByText("Rating: 1200")).toBeVisible()

      await logOutUser(page)
    })

    test("regular users cannot manage players", async ({ page }) => {
      const email = randomEmail()
      const password = randomPassword()
      const name = randomTeamName()

      await signUpNewUser(page, name, email, password)
      await logInUser(page, email, password)
      await page.goto("/players")

      await expect(page.getByRole("heading", { name: "Players" })).toBeVisible()
      await expect(
        page.getByRole("button", { name: "Add Player" }),
      ).toHaveCount(0)
      await expect(
        page.getByRole("button", { name: "Player actions" }),
      ).toHaveCount(0)

      await logOutUser(page)
    })
  })
