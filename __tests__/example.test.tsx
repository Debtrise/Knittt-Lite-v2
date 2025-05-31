import { render, screen } from '@testing-library/react'

describe('Example Test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })

  it('should render a div', () => {
    render(<div>Test</div>)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
}) 