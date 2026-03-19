import os
from decimal import Decimal
from django.conf import settings


def generate_payslip_pdf(payslip) -> str:
    """
    Generate a professional PDF payslip using ReportLab.
    Returns the relative file path saved under MEDIA_ROOT.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    import calendar

    MONTHS = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ]

    # Build file path
    rel_dir = f"payslips/{payslip.user.id}"
    abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
    os.makedirs(abs_dir, exist_ok=True)
    filename = f"{payslip.year}_{payslip.month:02d}.pdf"
    abs_path = os.path.join(abs_dir, filename)
    rel_path = f"{rel_dir}/{filename}"

    doc = SimpleDocTemplate(
        abs_path,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    BLUE = colors.HexColor('#1e3a8a')
    LIGHT_BLUE = colors.HexColor('#dbeafe')
    GREEN = colors.HexColor('#059669')
    GRAY = colors.HexColor('#6b7280')

    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                  fontSize=18, textColor=BLUE, alignment=TA_CENTER, spaceAfter=4)
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'],
                                fontSize=10, textColor=GRAY, alignment=TA_CENTER, spaceAfter=2)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'],
                                    fontSize=11, textColor=BLUE, spaceBefore=12, spaceAfter=4)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=9, textColor=GRAY)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=9)

    story = []

    # Header
    story.append(Paragraph("STA Technologies", title_style))
    story.append(Paragraph("Human Resource Administration", sub_style))
    story.append(Paragraph(f"PAYSLIP - {MONTHS[payslip.month].upper()} {payslip.year}", sub_style))
    story.append(HRFlowable(width='100%', thickness=2, color=BLUE, spaceAfter=12))

    # Employee Details
    story.append(Paragraph("Employee Details", section_style))
    emp = payslip.user

    bold_label = ParagraphStyle('BoldLabel', parent=styles['Normal'], fontSize=9,
                                 textColor=colors.HexColor('#374151'), fontName='Helvetica-Bold')
    cell_val = ParagraphStyle('CellVal', parent=styles['Normal'], fontSize=9, wordWrap='CJK')

    def lbl(text): return Paragraph(text, bold_label)
    def val(text): return Paragraph(str(text), cell_val)

    emp_data = [
        [lbl('Employee Name'), val(emp.full_name), lbl('Employee ID'), val(emp.employee_id or '-')],
        [lbl('Department'), val((emp.department or '-').capitalize()), lbl('Designation'), val(emp.designation or '-')],
        [lbl('Date of Joining'), val(str(emp.join_date) if emp.join_date else '-'), lbl('Pay Period'), val(f"{MONTHS[payslip.month]} {payslip.year}")],
    ]
    emp_table = Table(emp_data, colWidths=[3.5 * cm, 6.5 * cm, 3.5 * cm, 4.5 * cm])
    emp_table.setStyle(TableStyle([
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(emp_table)
    story.append(Spacer(1, 0.3 * cm))

    # Attendance
    story.append(Paragraph("Attendance Summary", section_style))
    att_data = [
        ['Working Days', str(payslip.working_days), 'Present Days', str(payslip.present_days)],
        ['Absent Days', str(payslip.absent_days), 'Leaves Taken', str(payslip.leaves_taken)],
    ]
    att_table = Table(att_data, colWidths=[4 * cm, 4 * cm, 4 * cm, 4 * cm])
    att_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [LIGHT_BLUE, colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
    ]))
    story.append(att_table)
    story.append(Spacer(1, 0.3 * cm))

    # Earnings and Deductions side by side
    story.append(Paragraph("Earnings & Deductions", section_style))
    earn_data = [
        ['EARNINGS', 'Amount (₹)', 'DEDUCTIONS', 'Amount (₹)'],
        ['Basic Salary', f"{float(payslip.basic_salary):,.2f}", 'Provident Fund (PF)', f"{float(payslip.pf_deduction):,.2f}"],
        ['HRA (40%)', f"{float(payslip.hra):,.2f}", 'Income Tax', f"{float(payslip.tax_deduction):,.2f}"],
        ['DA (20%)', f"{float(payslip.da):,.2f}", 'Other Deductions', f"{float(payslip.other_deductions):,.2f}"],
        ['TA (5%)', f"{float(payslip.ta):,.2f}", 'Loss of Pay', f"{float(payslip.loss_of_pay):,.2f}"],
        ['Other Allowances', f"{float(payslip.other_allowances):,.2f}", '', ''],
        ['GROSS SALARY', f"{float(payslip.gross_salary):,.2f}", 'TOTAL DEDUCTIONS',
         f"{float(payslip.pf_deduction + payslip.tax_deduction + payslip.other_deductions + payslip.loss_of_pay):,.2f}"],
    ]
    earn_table = Table(earn_data, colWidths=[5 * cm, 4 * cm, 5 * cm, 4 * cm])
    earn_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (1, 0), BLUE),
        ('BACKGROUND', (2, 0), (3, 0), colors.HexColor('#dc2626')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, -1), (1, -1), colors.HexColor('#dbeafe')),
        ('BACKGROUND', (2, -1), (3, -1), colors.HexColor('#fee2e2')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f9fafb')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
    ]))
    story.append(earn_table)
    story.append(Spacer(1, 0.5 * cm))

    # Net Salary Box
    net_data = [['NET SALARY (Take Home)', f"₹ {float(payslip.net_salary):,.2f}"]]
    net_table = Table(net_data, colWidths=[14 * cm, 4 * cm])
    net_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, -1), GREEN),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(net_table)
    story.append(Spacer(1, 0.5 * cm))

    # Footer
    story.append(HRFlowable(width='100%', thickness=1, color=GRAY))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
                                   fontSize=8, textColor=GRAY, alignment=TA_CENTER)
    story.append(Paragraph("This is a computer-generated payslip and does not require a signature.", footer_style))
    story.append(Paragraph(f"Generated on: {payslip.generated_at.strftime('%d %b %Y') if payslip.generated_at else '-'}", footer_style))

    doc.build(story)
    return rel_path
