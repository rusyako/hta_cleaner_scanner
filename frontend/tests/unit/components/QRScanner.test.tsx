import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QRScanner } from '@/components/QRScanner'
import { Html5Qrcode } from 'html5-qrcode'

// Mock html5-qrcode
jest.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      scanFile: jest.fn(),
    })),
  }
})

describe('QRScanner', () => {
  const mockOnScan = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders scanner modal with correct title', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    expect(screen.getByText('Сканировать QR код')).toBeInTheDocument()
  })

  it('shows camera button when not scanning', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    expect(screen.getByText('Включить камеру')).toBeInTheDocument()
  })

  it('shows file upload button', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    expect(screen.getByText('Загрузить изображение с QR')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const closeButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.classList.contains('h-6')
    )
    
    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const cancelButton = screen.getByText('Отмена')
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('starts camera scanning when camera button is clicked', async () => {
    const mockStart = jest.fn().mockResolvedValue(undefined)
    const mockScanner = {
      start: mockStart,
      stop: jest.fn().mockResolvedValue(undefined),
      scanFile: jest.fn(),
    }
    
    ;(Html5Qrcode as jest.Mock).mockImplementation(() => mockScanner)

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByText('Включить камеру')
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled()
    })
  })

  it('shows error message when camera access fails', async () => {
    const mockStart = jest.fn().mockRejectedValue(new Error('Camera not available'))
    const mockScanner = {
      start: mockStart,
      stop: jest.fn().mockResolvedValue(undefined),
      scanFile: jest.fn(),
    }
    
    ;(Html5Qrcode as jest.Mock).mockImplementation(() => mockScanner)

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByText('Включить камеру')
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(screen.getByText(/Не удалось получить доступ к камере/)).toBeInTheDocument()
    })
  })

  it('calls onScan and onClose when QR code is scanned successfully', async () => {
    const mockStart = jest.fn((config, settings, onSuccess) => {
      // Simulate successful scan
      setTimeout(() => onSuccess('CAB-101'), 100)
      return Promise.resolve()
    })
    
    const mockStop = jest.fn().mockResolvedValue(undefined)
    
    const mockScanner = {
      start: mockStart,
      stop: mockStop,
      scanFile: jest.fn(),
    }
    
    ;(Html5Qrcode as jest.Mock).mockImplementation(() => mockScanner)

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByText('Включить камеру')
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('CAB-101')
      expect(mockOnClose).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('handles file upload for QR scanning', async () => {
    const mockScanFile = jest.fn().mockResolvedValue('CAB-202')
    const mockScanner = {
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      scanFile: mockScanFile,
    }
    
    ;(Html5Qrcode as jest.Mock).mockImplementation(() => mockScanner)

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const uploadButton = screen.getByText('Загрузить изображение с QR')
    fireEvent.click(uploadButton)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const file = new File(['qr-code'], 'qr.png', { type: 'image/png' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(mockScanFile).toHaveBeenCalledWith(file, true)
      expect(mockOnScan).toHaveBeenCalledWith('CAB-202')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('shows error when QR code not found in uploaded image', async () => {
    const mockScanFile = jest.fn().mockRejectedValue(new Error('QR code not found'))
    const mockScanner = {
      start: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      scanFile: mockScanFile,
    }
    
    ;(Html5Qrcode as jest.Mock).mockImplementation(() => mockScanner)

    render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const uploadButton = screen.getByText('Загрузить изображение с QR')
    fireEvent.click(uploadButton)

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['invalid'], 'invalid.png', { type: 'image/png' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText('QR код не найден на изображении')).toBeInTheDocument()
    })
  })

  it('stops scanning when component unmounts', async () => {
    const mockStop = jest.fn().mockResolvedValue(undefined)
    const mockStart = jest.fn().mockResolvedValue(undefined)
    const mockScanner = {
      start: mockStart,
      stop: mockStop,
      scanFile: jest.fn(),
    }
    
    ;(Html5Qrcode as jest.Mock).mockImplementation(() => mockScanner)

    const { unmount } = render(<QRScanner onScan={mockOnScan} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByText('Включить камеру')
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled()
    })

    unmount()

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled()
    })
  })
})
