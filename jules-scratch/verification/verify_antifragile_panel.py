from playwright.sync_api import sync_playwright, Page, expect
import os

def verify_panel(page: Page):
    # 1. Navigate to the app
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)

    # 2. Go through the steps
    siguiente_button_1 = page.get_by_role("button", name="Siguiente")
    expect(siguiente_button_1).to_be_visible(timeout=60000)
    siguiente_button_1.click()

    siguiente_button_2 = page.get_by_role("button", name="Siguiente")
    expect(siguiente_button_2).to_be_visible()
    siguiente_button_2.click()

    value_button = page.get_by_role("button", name="Buscar Value")
    expect(value_button).to_be_enabled(timeout=60000)
    value_button.click()

    growth_button = page.get_by_role("button", name="Sí, agregar Growth")
    expect(growth_button).to_be_enabled(timeout=60000)
    growth_button.click()
    page.get_by_role("button", name="Buscar Growth").click()

    disruptive_button = page.get_by_role("button", name="Sí, agregar Disruptivas")
    expect(disruptive_button).to_be_enabled(timeout=60000)
    disruptive_button.click()
    page.get_by_role("button", name="Buscar Disruptivas").click()

    bonds_button = page.get_by_role("button", name="Sí, agregar Bonos/ETFs")
    expect(bonds_button).to_be_enabled(timeout=60000)
    bonds_button.click()
    page.get_by_role("button", name="Buscar Bonos/ETFs").click()

    final_analysis_button = page.get_by_role("button", name="Ver análisis final")
    expect(final_analysis_button).to_be_enabled(timeout=60000)
    final_analysis_button.click()

    # 3. Verify the panel is visible
    antifragile_panel = page.locator(".antifragile-panel")
    expect(antifragile_panel).to_be_visible(timeout=120000)

    expect(antifragile_panel.get_by_role("heading", name="Análisis Antifrágil (Estrategia Barbell)")).to_be_visible()

    # 4. Take a screenshot
    screenshot_path = "jules-scratch/verification/antifragile_panel.png"
    antifragile_panel.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {os.path.abspath(screenshot_path)}")


# Main execution block
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    page = browser.new_page()
    page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
    try:
        verify_panel(page)
    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()
