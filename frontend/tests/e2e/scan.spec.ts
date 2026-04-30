import { test, expect } from '@playwright/test'

test.describe('QR Scanner Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          username: 'testuser',
          full_name: 'Test User',
          role: 'cleaner',
        }),
      })
    })

    await page.goto('http://localhost:3000/scan')
  })

  test('displays scan page with QR input', async ({ page }) => {
    await expect(page.getByText('Сканирование QR-кода')).toBeVisible()
    await expect(page.getByPlaceholder(/Введите данные QR-кода/)).toBeVisible()
    await expect(page.getByText('Сканировать')).toBeVisible()
  })

  test('opens QR scanner modal when scan button clicked', async ({ page }) => {
    await page.getByText('Сканировать').click()
    
    await expect(page.getByText('Сканировать QR код')).toBeVisible()
    await expect(page.getByText('Включить камеру')).toBeVisible()
    await expect(page.getByText('Загрузить изображение с QR')).toBeVisible()
  })

  test('closes QR scanner modal when cancel clicked', async ({ page }) => {
    await page.getByText('Сканировать').click()
    await expect(page.getByText('Сканировать QR код')).toBeVisible()
    
    await page.getByText('Отмена').click()
    await expect(page.getByText('Сканировать QR код')).not.toBeVisible()
  })

  test('searches for cabinet when QR code entered manually', async ({ page }) => {
    // Mock cabinet search API
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'dirty',
          qr_code: 'CAB-101',
        }),
      })
    })

    const input = page.getByPlaceholder(/Введите данные QR-кода/)
    await input.fill('CAB-101')
    
    await page.getByText('Найти').click()
    
    await expect(page.getByText('Кабинет найден!')).toBeVisible()
    await expect(page.getByText('Номер: 101')).toBeVisible()
    await expect(page.getByText('Корпус: A')).toBeVisible()
  })

  test('shows error when cabinet not found', async ({ page }) => {
    // Mock cabinet not found
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Cabinet not found',
        }),
      })
    })

    const input = page.getByPlaceholder(/Введите данные QR-кода/)
    await input.fill('INVALID-QR')
    
    await page.getByText('Найти').click()
    
    await expect(page.getByText('Кабинет не найден')).toBeVisible()
  })

  test('displays report form when cabinet found', async ({ page }) => {
    // Mock cabinet search
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'dirty',
          qr_code: 'CAB-101',
        }),
      })
    })

    await page.getByPlaceholder(/Введите данные QR-кода/).fill('CAB-101')
    await page.getByText('Найти').click()
    
    await expect(page.getByText('Отчет об уборке')).toBeVisible()
    await expect(page.getByText('Длительность уборки (минут)')).toBeVisible()
    await expect(page.getByText('Фото (опционально)')).toBeVisible()
    await expect(page.getByText('Заметки (опционально)')).toBeVisible()
  })

  test('submits cleaning report successfully', async ({ page }) => {
    // Mock cabinet search
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'dirty',
          qr_code: 'CAB-101',
        }),
      })
    })

    // Mock report submission
    await page.route('**/api/reports', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          cabinet_id: '1',
          cleaner_id: '1',
          status: 'pending',
        }),
      })
    })

    // Find cabinet
    await page.getByPlaceholder(/Введите данные QR-кода/).fill('CAB-101')
    await page.getByText('Найти').click()
    await expect(page.getByText('Кабинет найден!')).toBeVisible()

    // Fill report form
    await page.getByRole('spinbutton').fill('20')
    await page.getByPlaceholder(/Что было сделано/).fill('Уборка выполнена качественно')

    // Submit report
    await page.getByText('Отправить отчет').click()

    // Should redirect to home page
    await expect(page).toHaveURL('http://localhost:3000/')
  })

  test('shows photo upload component in report form', async ({ page }) => {
    // Mock cabinet search
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'dirty',
          qr_code: 'CAB-101',
        }),
      })
    })

    await page.getByPlaceholder(/Введите данные QR-кода/).fill('CAB-101')
    await page.getByText('Найти').click()
    
    await expect(page.getByText('Перетащите фото сюда или')).toBeVisible()
    await expect(page.getByText('Выбрать файлы')).toBeVisible()
    await expect(page.getByText(/Максимум 5 фото/)).toBeVisible()
  })

  test('cancels report and clears form', async ({ page }) => {
    // Mock cabinet search
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'dirty',
          qr_code: 'CAB-101',
        }),
      })
    })

    await page.getByPlaceholder(/Введите данные QR-кода/).fill('CAB-101')
    await page.getByText('Найти').click()
    await expect(page.getByText('Кабинет найден!')).toBeVisible()

    // Fill some data
    await page.getByPlaceholder(/Что было сделано/).fill('Test notes')

    // Cancel
    await page.getByRole('button', { name: 'Отмена' }).click()

    // Form should be cleared
    await expect(page.getByText('Кабинет найден!')).not.toBeVisible()
    await expect(page.getByPlaceholder(/Введите данные QR-кода/)).toHaveValue('')
  })

  test('shows warning when cabinet already cleaned', async ({ page }) => {
    // Mock cabinet that's already clean
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'clean',
          qr_code: 'CAB-101',
        }),
      })
    })

    await page.getByPlaceholder(/Введите данные QR-кода/).fill('CAB-101')
    await page.getByText('Найти').click()
    
    await expect(page.getByText(/Этот кабинет уже был убран/)).toBeVisible()
  })

  test('disables input and scan button when cabinet found', async ({ page }) => {
    // Mock cabinet search
    await page.route('**/api/cabinets/qr/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          number: '101',
          building: 'A',
          floor: 1,
          status: 'dirty',
          qr_code: 'CAB-101',
        }),
      })
    })

    const input = page.getByPlaceholder(/Введите данные QR-кода/)
    await input.fill('CAB-101')
    await page.getByText('Найти').click()
    
    await expect(page.getByText('Кабинет найден!')).toBeVisible()
    await expect(input).toBeDisabled()
    await expect(page.getByText('Сканировать')).toBeDisabled()
  })
})
