import { useState } from 'react'
import { XPButton } from '../components/xp/XPButton'
import { XPDialog } from '../components/xp/XPDialog'

export function DialogDemo() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <XPButton variant="neutral" onClick={() => setOpen(true)}>
        Show dialog
      </XPButton>

      {open && (
        <XPDialog
          title="Essential Cookies accepted."
          footer={
            <XPButton variant="neutral" onClick={() => setOpen(false)}>
              OK
            </XPButton>
          }
        >
          <p>You may continue.</p>
        </XPDialog>
      )}
    </>
  )
}
