from flask import Flask, request, jsonify, render_template
import cv2
import uuid
from PIL import Image
import img2pdf
from firebase_config import bucket, db

app = Flask(__name__)


@app.route('/')
def home_page():  # home page
    return render_template('index.html')


def add_text_to_certificate(candidate_name, candidate_id):
    # define certificate image path
    certificate_image_path = 'blank_certificate.png'

    # define y axis
    y = 725

    # define font related parameters
    font_scale = 4  # font size
    font = cv2.FONT_HERSHEY_SCRIPT_COMPLEX  # font style
    thickness = 4  # font weight
    color = (0, 0, 0)  # font color

    # Load the image
    image = cv2.imread(certificate_image_path)

    # Get the width and height of the image
    (image_height, image_width) = image.shape[:2]

    # Get the text size
    text_size = cv2.getTextSize(candidate_name, font, font_scale, thickness)[0]

    # Calculate the x coordinate to center the text
    text_x = (image_width - text_size[0]) // 2

    # Put the text on the image
    cv2.putText(image, candidate_name, (text_x, y), font, font_scale, color, thickness)

    # Store the image in the temporary directory
    png_output_path = f"temporary/{candidate_id}.png"
    cv2.imwrite(png_output_path, image)

    # convert the cv2 image to pdf and save it in /output_pdf2 directory
    # storing pdf path
    pdf_path = f"output_pdfs/{candidate_id}.pdf"

    # opening image
    image = Image.open(png_output_path)

    # converting into chunks using img2pdf
    pdf_bytes = img2pdf.convert(image.filename)

    # opening or creating pdf file
    file = open(pdf_path, "wb")

    # writing pdf files with chunks
    file.write(pdf_bytes)

    # closing image file
    image.close()

    # closing pdf file
    file.close()


@app.route('/create/', methods=['GET'])
def create():
    # extract candidate_name and candidate_email from query
    candidate_name = request.args.get('candidate_name')[:20]
    candidate_email = request.args.get('candidate_email')
    # generate a unique id for the candidate
    candidate_id = uuid.uuid4().hex

    # add text to the certificate
    add_text_to_certificate(candidate_name, candidate_id)

    # Path to the locally generated PDF file
    pdf_path = f"output_pdfs/{candidate_id}.pdf"

    # Create a blob object for the PDF file
    blob = bucket.blob(f"certificates/{candidate_id}.pdf")

    # Upload the PDF file to Cloud Storage
    blob.upload_from_filename(pdf_path)

    # Make the blob publicly readable
    blob.make_public()

    # Get the public URL of the uploaded PDF
    public_url = blob.public_url
    local_url = "http://127.0.0.1:5000/certificate/" + candidate_id
    # Create a new document in the 'candidates' collection
    details = {
        'candidate_name': candidate_name,
        'candidate_email': candidate_email,
        'certificate_url': public_url,
        'local_url': local_url
    }
    doc_ref = db.collection('candidates').document(candidate_id)
    doc_ref.set(details)

    # return the details of the candidate
    return jsonify(details)


@app.route('/certificate/<candidate_id>/', methods=['GET'])
def get_certificate(candidate_id):
    doc_ref = db.collection('candidates').document(candidate_id)
    doc = doc_ref.get()
    if doc.exists:
        doc_data = doc.to_dict()
        return render_template('certificate.html', certificate_url=doc_data['certificate_url'],
                               certificate_id=candidate_id, candidate_name=doc_data['candidate_name'],
                               candidate_email=doc_data['candidate_email'])
    else:
        return 'Certificate not found', 404


@app.route('/search', methods=['GET'])
def search_certificate():
    search_type = request.args.get('type')
    query = request.args.get('query')

    if search_type == 'id':
        # Search by candidate_id
        doc_ref = db.collection('candidates').document(query)
        doc = doc_ref.get()
        if doc.exists:
            doc_data = doc.to_dict()
            return jsonify([{
                'candidate_name': doc_data['candidate_name'],
                'candidate_email': doc_data['candidate_email'],
                'certificate_url': doc_data['certificate_url'],
                'local_url': doc_data['local_url']
            }])
    elif search_type == 'name':
        # Search by candidate_name with partial matching
        query_ref = db.collection('candidates').where('candidate_name', '>=', query).where('candidate_name', '<=',
                                                                                           query + '\uf8ff').stream()
        results = []
        for doc in query_ref:
            doc_data = doc.to_dict()
            results.append({
                'candidate_name': doc_data['candidate_name'],
                'candidate_email': doc_data['candidate_email'],
                'certificate_url': doc_data['certificate_url'],
                'local_url': doc_data['local_url']
            })
        return jsonify(results)
    elif search_type == 'email':
        # Search by candidate_email with partial matching
        query_ref = db.collection('candidates').where('candidate_email', '>=', query).where('candidate_email', '<=',
                                                                                            query + '\uf8ff').stream()
        results = []
        for doc in query_ref:
            doc_data = doc.to_dict()
            results.append({
                'candidate_name': doc_data['candidate_name'],
                'candidate_email': doc_data['candidate_email'],
                'certificate_url': doc_data['certificate_url'],
                'local_url': doc_data['local_url']
            })
        return jsonify(results)
    else:
        return jsonify({'error': 'Invalid search type'}), 400

    return jsonify([])


if __name__ == '__main__':
    app.run(debug=True)
