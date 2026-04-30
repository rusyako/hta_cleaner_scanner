import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoUpload } from '@/components/PhotoUpload'
import axios from 'axios'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('PhotoUpload', () => {
  const mockOnUpload = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders upload zone when no photos uploaded', () => {
    render(<PhotoUpload onUpload={mockOnUpload} />)
    
    expect(screen.getByText(/Перетащите фото сюда или/)).toBeInTheDocument()
    expect(screen.getByText('Выбрать файлы')).toBeInTheDocument()
  })

  it('displays max files limit', () => {
    render(<PhotoUpload onUpload={mockOnUpload} maxFiles={3} />)
    
    expect(screen.getByText('Максимум 3 фото, до 5 МБ каждое')).toBeInTheDocument()
    expect(screen.getByText('Загружено: 0 / 3')).toBeInTheDocument()
  })

  it('displays existing photos', () => {
    const existingPhotos = [
      'http://localhost:3001/uploads/photo1.jpg',
      'http://localhost:3001/uploads/photo2.jpg',
    ]
    
    render(<PhotoUpload onUpload={mockOnUpload} existingPhotos={existingPhotos} />)
    
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', existingPhotos[0])
    expect(images[1]).toHaveAttribute('src', existingPhotos[1])
  })

  it('removes photo when delete button is clicked', () => {
    const existingPhotos = [
      'http://localhost:3001/uploads/photo1.jpg',
      'http://localhost:3001/uploads/photo2.jpg',
    ]
    
    render(<PhotoUpload onUpload={mockOnUpload} existingPhotos={existingPhotos} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: '' })
    fireEvent.click(deleteButtons[0])
    
    expect(mockOnUpload).toHaveBeenCalledWith([existingPhotos[1]])
  })

  it('uploads files when selected', async () => {
    const mockResponse = {
      data: {
        files: [
          { url: '/uploads/photo1.jpg', filename: 'photo1.jpg' },
        ],
      },
    }
    
    mockedAxios.post.mockResolvedValue(mockResponse)

    render(<PhotoUpload onUpload={mockOnUpload} />)
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/upload/multiple'),
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      )
    })

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([
        expect.stringContaining('/uploads/photo1.jpg'),
      ])
    })
  })

  it('handles drag and drop', async () => {
    const mockResponse = {
      data: {
        files: [
          { url: '/uploads/photo1.jpg', filename: 'photo1.jpg' },
        ],
      },
    }
    
    mockedAxios.post.mockResolvedValue(mockResponse)

    render(<PhotoUpload onUpload={mockOnUpload} />)
    
    const dropZone = screen.getByText(/Перетащите фото сюда или/).closest('div')
    expect(dropZone).toBeInTheDocument()

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(dropZone).toHaveClass('border-blue-500')

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })
  })

  it('shows uploading state', async () => {
    mockedAxios.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<PhotoUpload onUpload={mockOnUpload} />)
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText('Загрузка...')).toBeInTheDocument()
    })
  })

  it('limits number of uploaded files', () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    
    const existingPhotos = [
      'http://localhost:3001/uploads/photo1.jpg',
      'http://localhost:3001/uploads/photo2.jpg',
      'http://localhost:3001/uploads/photo3.jpg',
    ]
    
    const { container } = render(<PhotoUpload onUpload={mockOnUpload} maxFiles={3} existingPhotos={existingPhotos} />)
    
    // When max files reached, upload zone should not be visible
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument()
    
    alertSpy.mockRestore()
  })

  it('handles upload error', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    mockedAxios.post.mockRejectedValue(new Error('Upload failed'))

    render(<PhotoUpload onUpload={mockOnUpload} />)
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Ошибка загрузки фото')
    })

    alertSpy.mockRestore()
  })

  it('hides upload zone when max files reached', () => {
    const existingPhotos = [
      'http://localhost:3001/uploads/photo1.jpg',
      'http://localhost:3001/uploads/photo2.jpg',
      'http://localhost:3001/uploads/photo3.jpg',
    ]
    
    render(<PhotoUpload onUpload={mockOnUpload} maxFiles={3} existingPhotos={existingPhotos} />)
    
    expect(screen.queryByText('Выбрать файлы')).not.toBeInTheDocument()
  })

  it('uploads only remaining slots when multiple files selected', async () => {
    const mockResponse = {
      data: {
        files: [
          { url: '/uploads/photo1.jpg', filename: 'photo1.jpg' },
          { url: '/uploads/photo2.jpg', filename: 'photo2.jpg' },
        ],
      },
    }
    
    mockedAxios.post.mockResolvedValue(mockResponse)

    const existingPhotos = ['http://localhost:3001/uploads/existing.jpg']
    
    render(<PhotoUpload onUpload={mockOnUpload} maxFiles={3} existingPhotos={existingPhotos} />)
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const files = [
      new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' }),
      new File(['photo2'], 'photo2.jpg', { type: 'image/jpeg' }),
      new File(['photo3'], 'photo3.jpg', { type: 'image/jpeg' }),
    ]
    
    Object.defineProperty(fileInput, 'files', {
      value: files,
      writable: false,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.arrayContaining([
          existingPhotos[0],
          expect.stringContaining('/uploads/photo1.jpg'),
          expect.stringContaining('/uploads/photo2.jpg'),
        ])
      )
    })
  })
})
