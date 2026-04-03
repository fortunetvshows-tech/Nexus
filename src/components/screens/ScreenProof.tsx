'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

export function ScreenProof() {
  const { navigate, showToast, fileUploaded } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [selfReview, setSelfReview] = useState({
    meetsRequirements: false,
    originalContent: false,
    researchedThoroughly: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('File too large (max 10MB)', 'err')
        return
      }
      setFile(selectedFile)
      showToast(`File selected: ${selectedFile.name}`, 'ok')
    }
  }

  const handleToggleReview = (key: keyof typeof selfReview) => {
    setSelfReview(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async () => {
    // Validation
    if (!file) {
      showToast('Please upload a file', 'err')
      return
    }

    if (notes.trim().length < 10) {
      showToast('Please add detailed notes', 'err')
      return
    }

    const allReviewsPassed = Object.values(selfReview).every(v => v)
    if (!allReviewsPassed) {
      showToast('Complete self-review checklist', 'err')
      return
    }

    // Simulate submission
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitting(false)
    setSubmitted(true)

    showToast('Proof submitted for review! ✓', 'ok')
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 flex flex-col bg-void">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-void/95 backdrop-blur px-4 py-3 border-b border-line flex items-center gap-3">
          <h1 className="text-lg font-bold text-t1">Submission Complete</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <Card variant="glow-green" className="p-8 text-center w-full">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-go mb-2">Proof Submitted!</h2>
            <p className="text-sm text-t2 mb-4">
              Your submission has been received and sent for review. You'll be notified when the employer reviews your work.
            </p>
            <div className="bg-surface rounded-lg p-3 mb-4 text-xs text-t3">
              <p className="font-semibold text-t2 mb-1">Next Steps:</p>
              <ul className="text-left space-y-1">
                <li>✓ Wait for employer review (24-48 hours)</li>
                <li>✓ Check your wallet for payment</li>
                <li>✓ Earn reputation points</li>
              </ul>
            </div>
            <Button
              variant="primary"
              className="w-full mb-2"
              onClick={() => navigate('wallet')}
            >
              Check Wallet
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('discover')}
            >
              Find More Tasks
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-void">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-void/95 backdrop-blur px-4 py-3 border-b border-line flex items-center gap-3">
        <button
          onClick={() => navigate('slot')}
          className="text-xl text-t2 hover:text-t1 transition-colors"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-t1 flex-1">Submit Proof</h1>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* File Upload Zone */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">📄 Upload Proof</p>
          <label className="block">
            <div className="border-2 border-dashed border-pi/30 rounded-lg p-6 hover:border-pi hover:bg-pi/5 transition-all cursor-pointer text-center">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.png,.gif"
              />
              <div className="text-3xl mb-2">📦</div>
              <p className="text-sm text-t1 font-medium">
                {file ? file.name : 'Click to upload'}
              </p>
              <p className="text-xs text-t3 mt-1">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)}MB`
                  : 'PDF, DOC, TXT, Image (max 10MB)'}
              </p>
            </div>
          </label>
        </div>

        {/* Proof Notes */}
        <div className="px-4 py-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">📝 Proof Notes</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Explain how you completed this task. Be detailed and thorough."
            maxLength={1000}
            className="w-full px-3 py-2 rounded-lg bg-surface text-t1 placeholder-t3 border border-line focus:outline-none focus:border-pi text-sm focus:ring-1 focus:ring-pi/30 resize-none h-24"
          />
          <p className="text-xs text-t4 mt-1">
            {notes.length} / 1000 characters
          </p>
        </div>

        {/* Self-Review Checklist */}
        <div className="px-4 py-3">
          <p className="text-xs text-t3 uppercase tracking-wider mb-2">✓ Self-Review</p>
          <Card className="p-0 overflow-hidden">
            <button
              onClick={() => handleToggleReview('meetsRequirements')}
              className={`w-full px-4 py-3 flex items-center gap-3 border-b border-line hover:bg-card-h transition-colors text-left ${
                selfReview.meetsRequirements ? 'bg-go/5' : ''
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selfReview.meetsRequirements
                    ? 'bg-go border-go text-void'
                    : 'border-line'
                }`}
              >
                {selfReview.meetsRequirements && '✓'}
              </div>
              <span
                className={`text-sm ${
                  selfReview.meetsRequirements ? 'text-t3' : 'text-t1'
                }`}
              >
                Meets all requirements
              </span>
            </button>

            <button
              onClick={() => handleToggleReview('originalContent')}
              className={`w-full px-4 py-3 flex items-center gap-3 border-b border-line hover:bg-card-h transition-colors text-left ${
                selfReview.originalContent ? 'bg-go/5' : ''
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selfReview.originalContent
                    ? 'bg-go border-go text-void'
                    : 'border-line'
                }`}
              >
                {selfReview.originalContent && '✓'}
              </div>
              <span
                className={`text-sm ${
                  selfReview.originalContent ? 'text-t3' : 'text-t1'
                }`}
              >
                Original content (no copy-paste)
              </span>
            </button>

            <button
              onClick={() => handleToggleReview('researchedThoroughly')}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-card-h transition-colors text-left ${
                selfReview.researchedThoroughly ? 'bg-go/5' : ''
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selfReview.researchedThoroughly
                    ? 'bg-go border-go text-void'
                    : 'border-line'
                }`}
              >
                {selfReview.researchedThoroughly && '✓'}
              </div>
              <span
                className={`text-sm ${
                  selfReview.researchedThoroughly ? 'text-t3' : 'text-t1'
                }`}
              >
                Researched thoroughly
              </span>
            </button>
          </Card>
        </div>

        {/* Quality Badge Info */}
        <div className="px-4 py-3">
          <Card className="p-3 bg-pulse/5 border border-pulse/30">
            <p className="text-xs text-pulse mb-1 font-semibold">💎 Quality Tip:</p>
            <p className="text-xs text-t3">
              Quality submissions earn higher approval rates and faster payments. Take your time!
            </p>
          </Card>
        </div>

        <div className="h-8" />
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur border-t border-line px-4 py-3 z-40">
        <Button
          variant="go"
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : '✓ Submit Proof'}
        </Button>
        <Button
          variant="ghost"
          className="w-full mt-2"
          onClick={() => navigate('slot')}
          disabled={submitting}
        >
          Save as Draft
        </Button>
      </div>
    </div>
  )
}

